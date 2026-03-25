package com.vento.common.context;

import java.util.Optional;

/**
 * Contexto de usuario almacenado en ThreadLocal.
 * <p>
 * Permite acceder a la información del usuario autenticado desde cualquier capa
 * del servicio (controller, service, repository) sin necesidad de pasar el userId
 * como parámetro en todos los métodos.
 * <p>
 * Uso típico:
 * 1. Un filtro HTTP extrae los headers X-User-Id y X-User-Roles
 * 2. Llama a UserContext.set() para almacenar la información
 * 3. El código de negocio puede acceder vía UserContext.getUserId()
 * 4. Al finalizar la request, el filtro llama a UserContext.clear()
 * <p>
 * ThreadLocal asegura que cada hilo tenga su propio contexto aislado.
 */
public class UserContext {

    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLES = new ThreadLocal<>();

    private UserContext() {
        // Clase utilitaria, no instanciable
    }

    /**
     * Establece el ID del usuario en el contexto actual.
     *
     * @param userId El identificador único del usuario
     */
    public static void setUserId(String userId) {
        USER_ID.set(userId);
    }

    /**
     * Obtiene el ID del usuario del contexto actual.
     *
     * @return El ID del usuario, o null si no hay contexto
     */
    public static String getUserId() {
        return USER_ID.get();
    }

    /**
     * Obtiene el ID del usuario del contexto actual como Optional.
     *
     * @return Optional con el ID del usuario
     */
    public static Optional<String> getUserIdOptional() {
        return Optional.ofNullable(USER_ID.get());
    }

    /**
     * Establece los roles del usuario en el contexto actual.
     *
     * @param roles Los roles del usuario separados por coma
     */
    public static void setRoles(String roles) {
        USER_ROLES.set(roles);
    }

    /**
     * Obtiene los roles del usuario del contexto actual.
     *
     * @return Los roles separados por coma, o null si no hay contexto
     */
    public static String getRoles() {
        return USER_ROLES.get();
    }

    /**
     * Obtiene los roles del usuario como array.
     *
     * @return Array de roles
     */
    public static String[] getRolesArray() {
        String roles = USER_ROLES.get();
        if (roles == null || roles.isEmpty()) {
            return new String[0];
        }
        return roles.split(",");
    }

    /**
     * Limpia el contexto del hilo actual.
     * Debe llamarse al finalizar cada request para evitar memory leaks.
     */
    public static void clear() {
        USER_ID.remove();
        USER_ROLES.remove();
    }
}
