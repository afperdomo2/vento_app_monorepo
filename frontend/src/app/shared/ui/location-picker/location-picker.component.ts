import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import 'leaflet-control-geocoder';
import { CommonModule } from '@angular/common';

// Fix Leaflet icon paths for Angular
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Default center (Bogotá, Colombia)
const DEFAULT_CENTER: [number, number] = [4.6097, -74.0817];
const DEFAULT_ZOOM = 6;

@Component({
  selector: 'app-location-picker',
  imports: [LeafletModule, CommonModule],
  template: `
    <div class="location-picker-container" [id]="'location-picker-' + pickerId">
      <div class="map-container" 
           leaflet 
           [leafletOptions]="options" 
           (leafletMapReady)="onMapReady($event)">
      </div>
      <div class="location-info" *ngIf="currentLat && currentLng">
        <p class="text-sm font-medium text-on-surface mb-0.5">📍 Ubicación seleccionada:</p>
        <small class="text-on-surface-variant">Lat: {{ currentLat | number:'1.5-5' }}, Lng: {{ currentLng | number:'1.5-5' }}</small>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .location-picker-container {
      width: 100%;
    }
    .map-container {
      height: 100%;
      min-height: 350px;
      width: 100%;
      border-radius: 0.75rem;
      z-index: 1;
      overflow: hidden;
    }
    .location-info {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border-radius: 0.375rem;
    }
  `]
})
export class LocationPickerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() initialLat: number = 0;
  @Input() initialLng: number = 0;
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();

  // Unique ID to prevent container reuse issues
  pickerId = Math.random().toString(36).substring(2, 9);

  map: L.Map | null = null;
  marker: L.Marker | null = null;
  geocoder: any = null;
  isMapReady = false;

  currentLat: number | null = null;
  currentLng: number | null = null;

  options = {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      })
    ]
  };

  ngOnInit() {
    if (this.initialLat && this.initialLng) {
      this.currentLat = this.initialLat;
      this.currentLng = this.initialLng;
      this.options = {
        ...this.options,
        center: [this.initialLat, this.initialLng],
        zoom: 12
      };
    }
  }

  ngAfterViewInit() {
    // Geocoder initializes when map is ready
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.isMapReady = true;

    // Configure Geocoder
    this.geocoder = (L.Control as any).geocoder({
      defaultMarkGeocode: false,
      position: 'topright'
    })
      .on('markgeocode', (e: any) => {
        const bbox = e.geocode.bbox;
        const center = e.geocode.center;
        const lat = center.lat;
        const lng = center.lng;

        this.updateMarker(lat, lng);

        if (bbox) {
          map.fitBounds(bbox);
        }
      })
      .addTo(map);

    // If there's initial location, place marker
    if (this.currentLat && this.currentLng) {
      this.updateMarker(this.currentLat, this.currentLng);
    }
  }

  updateMarker(lat: number, lng: number) {
    this.currentLat = lat;
    this.currentLng = lng;
    this.locationChange.emit({ lat, lng });

    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], {
        draggable: true
      }).addTo(this.map!);

      this.marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        this.currentLat = pos.lat;
        this.currentLng = pos.lng;
        this.locationChange.emit({ lat: pos.lat, lng: pos.lng });
      });
    }

    this.map.setView([lat, lng], 15);
  }

  ngOnDestroy() {
    this.isMapReady = false;
    if (this.marker) {
      this.marker.off('dragend');
      this.marker.remove();
      this.marker = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
