export interface Inventario {
  id: number;
  codigo: string;
  herramienta: string;
  numeroSerie: string;
  marca: string;
  fechaUltimoMantenimiento: string | null;
  fechaProximoMantenimiento: string | null;
  empresaMantenimiento: string;
  fechaCompra: string | null;
  proveedor: string;
  garantia: number;
  observaciones: string;
  ubicacion: string;
  responsable: string;
  estado: string;
  cantidad: number;
}
