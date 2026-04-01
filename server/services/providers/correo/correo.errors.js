class CorreoError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'CORREO_ERROR';
        this.details = options.details || null;
        this.cause = options.cause || null;
    }
}

class CorreoAuthError extends CorreoError {
    constructor(message = 'Error de autenticación con Correo Argentino', options = {}) {
        super(message, {
            statusCode: 401,
            code: 'CORREO_AUTH_ERROR',
            ...options,
        });
    }
}

class CorreoValidationError extends CorreoError {
    constructor(message = 'Datos inválidos para Correo Argentino', options = {}) {
        super(message, {
            statusCode: 400,
            code: 'CORREO_VALIDATION_ERROR',
            ...options,
        });
    }
}

class CorreoNoCoverageError extends CorreoError {
    constructor(message = 'No hay cobertura para el destino solicitado', options = {}) {
        super(message, {
            statusCode: 404,
            code: 'CORREO_NO_COVERAGE',
            ...options,
        });
    }
}

class CorreoRateError extends CorreoError {
    constructor(message = 'No se pudo obtener cotización de Correo Argentino', options = {}) {
        super(message, {
            statusCode: 502,
            code: 'CORREO_RATE_ERROR',
            ...options,
        });
    }
}

class CorreoApiError extends CorreoError {
    constructor(message = 'Error de API de Correo Argentino', options = {}) {
        super(message, {
            statusCode: options.statusCode || 502,
            code: 'CORREO_API_ERROR',
            ...options,
        });
    }
}

module.exports = {
    CorreoError,
    CorreoAuthError,
    CorreoValidationError,
    CorreoNoCoverageError,
    CorreoRateError,
    CorreoApiError,
};