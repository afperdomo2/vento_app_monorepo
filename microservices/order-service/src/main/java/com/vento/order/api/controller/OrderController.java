package com.vento.order.api.controller;

import com.vento.common.dto.ApiResponse;
import com.vento.common.dto.order.CreateOrderRequest;
import com.vento.common.dto.order.OrderDto;
import com.vento.common.exception.AccessDeniedException;
import com.vento.common.exception.ResourceNotFoundException;
import com.vento.order.core.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Pedidos", description = "API para gestión de pedidos")
public class OrderController {

    private final OrderService orderService;

    @Operation(
            summary = "Crear un nuevo pedido",
            description = """
                    Crea un nuevo pedido y reserva los tickets de forma atómica en Redis (DECRBY).

                    **Reserva temporal con TTL:**
                    Al crear la orden se genera automáticamente una reserva temporal en Redis con una \
                    duración de **5 minutos** (configurable via `vento.reservation.ttl-minutes`).
                    Durante ese tiempo los tickets quedan bloqueados para este pedido.

                    **Estados posibles tras la creación:**
                    - `PENDING` → estado inicial. El usuario tiene 5 minutos para confirmar o cancelar.

                    **¿Qué ocurre si no se confirma a tiempo?**
                    Un job programado detecta las órdenes `PENDING` vencidas y las mueve a `EXPIRED`, \
                    liberando los tickets de vuelta al inventario de Redis automáticamente.

                    **Flujo recomendado:**
                    1. `POST /api/orders` → orden en estado `PENDING`
                    2. (Procesar pago en los próximos 5 minutos)
                    3. `PUT /api/orders/{id}/confirm` → orden pasa a `CONFIRMED`

                    Si el pago falla o el usuario desiste: `PUT /api/orders/{id}/cancel`.
                    """
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Pedido creado exitosamente en estado PENDING. La reserva expira en 5 minutos.",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos o header X-User-Id faltante",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "No hay suficientes tickets disponibles (Redis rechazó el DECRBY)",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        OrderDto order = orderService.createOrder(request, userId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pedido creado exitosamente", order));
    }

    @Operation(summary = "Obtener pedido por ID", description = "Retorna los detalles de un pedido específico. Solo el dueño del pedido puede verlo.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Pedido encontrado",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Pedido no encontrado"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "No tienes permiso para ver este pedido"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Header X-User-Id faltante"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @Parameter(description = "ID del pedido") @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID authenticatedUserId) {
        OrderDto order = orderService.getOrderById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));

        // Validar que el usuario autenticado es el dueño del pedido
        if (!order.getUserId().equals(authenticatedUserId)) {
            throw new AccessDeniedException("No tienes permiso para ver este pedido");
        }

        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @Operation(summary = "Obtener mis pedidos", description = "Retorna la lista paginada de pedidos del usuario autenticado, ordenados por fecha de creación descendente.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Lista de pedidos encontrados",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Header X-User-Id faltante"
            )
    })
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getMyOrders(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderDto> orders = orderService.getOrdersByUserId(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @Operation(summary = "Cancelar pedido", description = "Cancela un pedido existente. Solo el dueño del pedido puede cancelarlo.")
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
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "No tienes permiso para cancelar este pedido"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Header X-User-Id faltante"
            )
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @Parameter(description = "ID del pedido") @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID authenticatedUserId) {
        OrderDto cancelledOrder = orderService.cancelOrder(id, authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
        return ResponseEntity.ok(ApiResponse.success("Pedido cancelado exitosamente", cancelledOrder));
    }

    @Operation(
            summary = "Confirmar pedido",
            description = """
                    Confirma un pedido en estado `PENDING`, simulando un pago exitoso.
                    Cambia el estado a `CONFIRMED` y elimina la reserva temporal de Redis.

                    **Importante:** solo se pueden confirmar pedidos en estado `PENDING`. \
                    Si la reserva ya expiró (estado `EXPIRED`) no es posible confirmarla.
                    """
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Pedido confirmado exitosamente",
                    content = @Content(schema = @Schema(implementation = OrderDto.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Pedido no encontrado"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "El pedido no puede ser confirmado en su estado actual"
            )
    })
    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<OrderDto>> confirmOrder(
            @Parameter(description = "ID del pedido") @PathVariable UUID id) {
        OrderDto confirmedOrder = orderService.confirmOrder(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
        return ResponseEntity.ok(ApiResponse.success("Pedido confirmado exitosamente", confirmedOrder));
    }
}

