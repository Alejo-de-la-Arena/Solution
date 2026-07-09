import { Component } from 'react';

/**
 * Último recurso ante un error de render no capturado: en vez de pantalla
 * blanca, muestra un mensaje con botón de recarga. El carrito vive en
 * localStorage, así que recargar no pierde nada.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info?.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="max-w-md text-center flex flex-col items-center gap-5">
                    <h1 className="text-2xl font-semibold">Algo salió mal</h1>
                    <p className="text-white/60">
                        Ocurrió un error inesperado al cargar la página. Recargala para
                        continuar — tu carrito no se pierde.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-[rgb(0,255,255)] text-black font-semibold rounded hover:opacity-90 transition-opacity"
                    >
                        Recargar página
                    </button>
                </div>
            </div>
        );
    }
}
