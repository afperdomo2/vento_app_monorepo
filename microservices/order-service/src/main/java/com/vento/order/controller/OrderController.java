package com.vento.order.controller;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Pedidos", description = "API para gestión de pedidos")
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Crear un nuevo pedido", description = "Crea un nuevo pedido para reservar entradas a un evento")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Pedido creado exitosamente",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "No hay tickets disponibles",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDto order = orderService.createOrder(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pedido creado exitosamente", order));
    }

    @Operation(summary = "Obtener pedido por ID", description = "Retorna los detalles de un pedido específico")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Pedido encontrado",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Pedido no encontrado"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @Parameter(description = "ID del pedido") @PathVariable UUID id) {
        OrderDto order = orderService.getOrderById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @Operation(summary = "Obtener pedidos por usuario", description = "Retorna la lista de pedidos de un usuario específico")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Lista de pedidos encontrados",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            )
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrdersByUserId(
            @Parameter(description = "ID del usuario") @PathVariable UUID userId) {
        List<OrderDto> orders = orderService.getOrdersByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @Operation(summary = "Cancelar pedido", description = "Cancela un pedido existente")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Pedido cancelado exitosamente",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Pedido no encontrado"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "El pedido no puede ser cancelado en su estado actual"
            )
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @Parameter(description = "ID del pedido") @PathVariable UUID id) {
        OrderDto order = orderService.cancelOrder(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
        return ResponseEntity.ok(ApiResponse.success("Pedido cancelado exitosamente", order));
    }
}

