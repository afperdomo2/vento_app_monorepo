import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-control-geocoder';

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
  imports: [LeafletModule, DecimalPipe],
  host: {
    '[class.read-only-map]': 'readOnly',
  },
  template: `
    <div class="location-picker-container" [id]="'location-picker-' + pickerId">
      @if (renderMap) {
        <div class="map-container"
             leaflet
             [leafletOptions]="options"
             (leafletMapReady)="onMapReady($event)">
        </div>
      }
      @if (!readOnly && currentLat && currentLng) {
        <div class="location-info">
          <p class="text-sm font-medium text-on-surface mb-0.5">📍 Ubicación seleccionada:</p>
          <small class="text-on-surface-variant">Lat: {{ currentLat | number:'1.5-5' }}, Lng: {{ currentLng | number:'1.5-5' }}</small>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .location-picker-container {
      width: 100%;
      height: 100%;
    }
    .map-container {
      height: 100%;
      min-height: 350px;
      width: 100%;
      border-radius: 0.75rem;
      z-index: 1;
      overflow: hidden;
    }
    :host.read-only-map .map-container {
      min-height: 200px;
    }
    .location-info {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border-radius: 0.375rem;
    }

    /* ===== Geocoder overrides ===== */
    /* Use ::ng-deep because Leaflet renders the geocoder outside this component's DOM */
    :host ::ng-deep .leaflet-control-geocoder {
      background: #fff !important;
      border-radius: 0.75rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.18) !important;
      width: 260px !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-form {
      width: 100% !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-form input {
      background: #fff !important;
      color: #1f2937 !important;
      border: none;
      border-radius: 0.75rem;
      padding: 6px 12px;
      font-size: 13px;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-form input::placeholder {
      color: #9ca3af !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives {
      background: #fff !important;
      border-radius: 0 0 0.75rem 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,.12) !important;
      width: 260px !important;
      left: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      list-style: none !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives li {
      height: 80px !important;
      min-height: 80px !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      border-bottom: 1px solid #f3f4f6 !important;
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives li:last-child {
      border-bottom: none !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives a {
      color: #1f2937 !important;
      padding: 10px 12px !important;
      font-size: 13px;
      line-height: 1.5;
      width: 100% !important;
      box-sizing: border-box !important;
      display: block !important;
      text-decoration: none !important;
      background: transparent !important;
      border: none !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives a:hover,
    :host ::ng-deep .leaflet-control-geocoder-alternatives li:hover {
      background: #f0f4ff !important;
      color: #4a40e0 !important;
    }
    :host ::ng-deep .leaflet-control-geocoder-alternatives .leaflet-control-geocoder-address-detail {
      color: #6b7280 !important;
      font-size: 12px;
    }
  `]
})
export class LocationPickerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() initialLat: number = 0;
  @Input() initialLng: number = 0;
  /** When true, the marker is not draggable and no location events are emitted. */
  @Input() readOnly: boolean = false;
  /** When false, the geocoder/search bar is not added to the map. */
  @Input() showSearch: boolean = true;
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();

  // Unique ID to prevent container reuse issues
  pickerId = Math.random().toString(36).substring(2, 9);
  renderMap = true; // Used to force recreation on HMR

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

    // Configure Geocoder only when search is enabled and not in read-only mode
    if (this.showSearch && !this.readOnly) {
      this.geocoder = (L.Control as any).geocoder({
        defaultMarkGeocode: false,
        position: 'topright',
        collapsed: true
      })
        .on('markgeocode', (e: any) => {
          const bbox = e.geocode.bbox;
          const center = e.geocode.center;
          const lat = center.lat;
          const lng = center.lng;

          this.updateMarker(lat, lng);

          // Collapse the geocoder after selection
          if (this.geocoder && this.geocoder._collapse) {
            this.geocoder._collapse();
          }

          if (bbox) {
            map.fitBounds(bbox);
          }
        })
        .addTo(map);
    }

    // If there's initial location, place marker
    if (this.currentLat && this.currentLng) {
      this.updateMarker(this.currentLat, this.currentLng);
    }
  }

  updateMarker(lat: number, lng: number) {
    this.currentLat = lat;
    this.currentLng = lng;

    // Only emit in editable mode
    if (!this.readOnly) {
      this.locationChange.emit({ lat, lng });
    }

    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], {
        draggable: !this.readOnly
      }).addTo(this.map!);

      // Only add drag listener in editable mode
      if (!this.readOnly) {
        this.marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          this.currentLat = pos.lat;
          this.currentLng = pos.lng;
          this.locationChange.emit({ lat: pos.lat, lng: pos.lng });
        });
      }
    }

    this.map.setView([lat, lng], 15);
  }

  ngOnDestroy() {
    this.isMapReady = false;
    this.renderMap = false; // Signal Angular to destroy the container
    if (this.marker) {
      try {
        this.marker.off('dragend');
        this.marker.remove();
      } catch (e) { /* ignore if already removed */ }
      this.marker = null;
    }
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) { /* ignore if HMR already removed container */ }
      this.map = null;
    }
  }
}
