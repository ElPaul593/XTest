// Lista de ciudades disponibles para filtros y selección
export const CIUDADES = [
  'Quito',
  'Guayaquil',
  'Cuenca'
];

export const CIUDADES_OPTIONS = [
  { value: '', label: 'Todas las ciudades' },
  ...CIUDADES.map(ciudad => ({ value: ciudad, label: ciudad }))
];

