// Datos de lugares turísticos por provincia (sin Galápagos)
const lugaresTuristicosRaw = [
  // Azuay (Cuenca)
  {
    nombre: 'Catedral de la Inmaculada Concepción',
    ciudad: 'Cuenca',
    direccion: 'Calle Mariscal Sucre y Benigno Malo',
    descripcion: 'Catedral neogótica construida en el siglo XIX, símbolo de Cuenca',
    tipo: 'Monumento',
    horario: 'Lunes a Sábado: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Interior%20de%20la%20Catedral%20de%20la%20Inmaculada%20Concepci%C3%B3n.jpg'
  },
  {
    nombre: 'Parque Nacional Cajas',
    ciudad: 'Cuenca',
    direccion: 'A 30 km al oeste de Cuenca',
    descripcion: 'Reserva natural con más de 200 lagunas y paisajes andinos únicos',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Paisaje%20Parque%20Nacional%20El%20Cajas%20II.jpg'
  },
  {
    nombre: 'Museo Pumapungo',
    ciudad: 'Cuenca',
    direccion: 'Calle Larga y Huayna Cápac',
    descripcion: 'Museo arqueológico con restos de la ciudad inca de Tomebamba',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:30',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Terrazas%20Pumapungo.jpg'
  },
  {
    nombre: 'Museo de las Conceptas',
    ciudad: 'Cuenca',
    direccion: 'Calle Hermano Miguel y Presidente Córdova',
    descripcion: 'Museo de arte religioso colonial en antiguo convento',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 18:30, Sábados: 10:00 - 13:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sala%20de%20la%20celda-%20Museo%20de%20las%20Conceptas.jpg'
  },
  {
    nombre: 'Mirador de Turi',
    ciudad: 'Cuenca',
    direccion: 'Parroquia Turi',
    descripcion: 'Mirador con vista panorámica de toda la ciudad de Cuenca',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mirador%20de%20Turi%20Ecuador%201743.jpg'
  },
  {
    nombre: 'Ruinas de Todos los Santos',
    ciudad: 'Cuenca',
    direccion: 'Calle Larga y Todos los Santos',
    descripcion: 'Ruinas arqueológicas de la época colonial',
    tipo: 'Monumento',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://img.goraymi.com/2016/03/10/b841f642cb5fc485cfcf3f4f0927c812_xl.jpg'
  },

  // Bolívar (Guaranda)
  {
    nombre: 'Cascada de San Vicente',
    ciudad: 'Guaranda',
    direccion: 'Parroquia San Vicente, Guaranda',
    descripcion: 'Hermosa cascada natural rodeada de vegetación',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://s1.wklcdn.com/image_485/14566538/252701229/148724740.400x300.jpg'
  },
  {
    nombre: 'Parque Central de Guaranda',
    ciudad: 'Guaranda',
    direccion: 'Centro de Guaranda',
    descripcion: 'Parque central con monumentos y arquitectura colonial',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://i0.wp.com/www.guaranda.gob.ec/newsiteCMT/wp-content/uploads/2016/06/parque_central3.jpg?resize=770%2C470&ssl=1'
  },
  {
    nombre: 'Mirador de Guaranda',
    ciudad: 'Guaranda',
    direccion: 'Cerro de Guaranda',
    descripcion: 'Mirador con vista panorámica de los siete cerros',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://i0.wp.com/guialugaresturisticos.com/wp-content/uploads/2023/06/26168419_782112545322092_5696350572596988061_n.jpg?fit=660%2C495&ssl=1'
  },
  {
    nombre: 'Cascada de Salinas',
    ciudad: 'Guaranda',
    direccion: 'Parroquia Salinas',
    descripcion: 'Cascada natural en zona rural de Guaranda',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Salinas_de_Guaranda_Ecuador.jpg'
  },

  // Cañar (Azogues)
  {
    nombre: 'Complejo Arqueológico Ingapirca',
    ciudad: 'Cañar',
    direccion: 'A 16 km de Cañar',
    descripcion: 'Ruinas incas más importantes del Ecuador, templo del sol',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 6,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ama%20la%20Vida%20-%20Flickr%20-%20Complejo%20Arqueol%C3%B3gico%20de%20Ingapirca%20%288227405796%29.jpg'
  },
  {
    nombre: 'Catedral de Azogues',
    ciudad: 'Azogues',
    direccion: 'Parque Central de Azogues',
    descripcion: 'Catedral neoclásica del siglo XIX',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral%20de%20Azogues%2C%20noche%20%28cropped%29.png'
  },
  {
    nombre: 'Museo del Banco Central',
    ciudad: 'Azogues',
    direccion: 'Centro de Azogues',
    descripcion: 'Museo con arte y arqueología de la región',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_Banco_Central_Cuenca.png'
  },
  {
    nombre: 'Mirador de Ingapirca',
    ciudad: 'Cañar',
    direccion: 'Complejo Arqueológico Ingapirca',
    descripcion: 'Mirador con vista del complejo arqueológico y paisaje andino',
    tipo: 'Parque',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 6,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ruinas_de_Ingapirca_-_Ecuador.JPG'
  },

  // Carchi (Tulcán)
  {
    nombre: 'Cementerio de Tulcán',
    ciudad: 'Tulcán',
    direccion: 'Calle Sucre y 10 de Agosto',
    descripcion: 'Cementerio con esculturas de ciprés únicas en el mundo',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cementerio%20de%20Tulc%C3%A1n.jpg'
  },
  {
    nombre: 'Reserva Ecológica El Ángel',
    ciudad: 'Tulcán',
    direccion: 'A 27 km de Tulcán',
    descripcion: 'Reserva con frailejones gigantes y paisajes paramunos',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Reserva%20Ecol%C3%B3gica%20El%20%C3%81ngel.jpg'
  },
  {
    nombre: 'Parque Central de Tulcán',
    ciudad: 'Tulcán',
    direccion: 'Centro de Tulcán',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tulcan%20-%20Parque%20Central.JPG'
  },
  {
    nombre: 'Laguna de El Voladero',
    ciudad: 'Tulcán',
    direccion: 'Reserva El Ángel',
    descripcion: 'Laguna andina en la reserva ecológica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Laguna_de_El_Voladero_-_panoramio.jpg'
  },
  {
    nombre: 'Frontera de Rumichaca',
    ciudad: 'Tulcán',
    direccion: 'A 7 km de Tulcán',
    descripcion: 'Puente internacional entre Ecuador y Colombia',
    tipo: 'Monumento',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rumichaca_3.JPG'
  },

  // Cotopaxi (Latacunga)
  {
    nombre: 'Volcán Cotopaxi',
    ciudad: 'Latacunga',
    direccion: 'Parque Nacional Cotopaxi',
    descripcion: 'Volcán activo más alto del mundo, 5897 metros de altura',
    tipo: 'Montaña',
    horario: 'Todos los días: 8:00 - 15:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Volc%C3%A1n%20Cotopaxi%2C%20Ecuador.JPG'
  },
  {
    nombre: 'Laguna de Limpiopungo',
    ciudad: 'Latacunga',
    direccion: 'Parque Nacional Cotopaxi',
    descripcion: 'Hermosa laguna andina a los pies del volcán Cotopaxi',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 15:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cotopaxi%20National%20Park%20Trail%20around%20Laguna%20de%20Limpiopungo%2010.jpg'
  },
  {
    nombre: 'Centro Histórico de Latacunga',
    ciudad: 'Latacunga',
    direccion: 'Centro de Latacunga',
    descripcion: 'Centro histórico con arquitectura colonial y republicana',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Latacunga%20Calle%20Guayaquil%206-38.jpg'
  },
  {
    nombre: 'Museo de la Casa de los Marqueses',
    ciudad: 'Latacunga',
    direccion: 'Calle Maldonado',
    descripcion: 'Museo histórico en casa colonial del siglo XVIII',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Casa%20de%20los%20Marqueses%2C%20Latacunga.jpg'
  },
  {
    nombre: 'Refugio José Rivas',
    ciudad: 'Latacunga',
    direccion: 'Parque Nacional Cotopaxi',
    descripcion: 'Refugio de montaña a 4800 metros de altura',
    tipo: 'Montaña',
    horario: 'Todos los días: 8:00 - 15:00',
    precioEntrada: 10,
    imagen: 'https://www.apatita.com/rutas/Expediciones/cotopaxi/fotos/31_refugio_jose_rivas.jpg'
  },
  {
    nombre: 'Laguna de Quilotoa',
    ciudad: 'Latacunga',
    direccion: 'A 60 km de Latacunga',
    descripcion: 'Laguna volcánica de color turquesa, una de las más hermosas del Ecuador',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Panor%C3%A1mica%20de%20la%20Laguna%20de%20Quilotoa%2C%20Ecuador.jpg'
  },

  // Chimborazo (Riobamba)
  {
    nombre: 'Volcán Chimborazo',
    ciudad: 'Riobamba',
    direccion: 'Reserva de Producción Faunística Chimborazo',
    descripcion: 'Punto más alejado del centro de la Tierra, 6263 metros',
    tipo: 'Montaña',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chimborazo%20volcan.JPG'
  },
  {
    nombre: 'Centro Histórico de Riobamba',
    ciudad: 'Riobamba',
    direccion: 'Centro de Riobamba',
    descripcion: 'Centro histórico con arquitectura colonial y republicana',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Plaza-Luis-Alberto-Costales-Riobamba.jpg'
  },
  {
    nombre: 'Museo de la Concepción',
    ciudad: 'Riobamba',
    direccion: 'Calle Argentinos y España',
    descripcion: 'Museo de arte religioso y colonial',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Arte_Religioso_Museo_de_la_Concepci%C3%B3n_Riobamba_San_Antonio_de_Padua.jpg'
  },
  {
    nombre: 'Refugio Carrel',
    ciudad: 'Riobamba',
    direccion: 'Volcán Chimborazo',
    descripcion: 'Refugio de montaña a 4800 metros en el Chimborazo',
    tipo: 'Montaña',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/RefugioCarrelChimborazo1997.jpg'
  },
  {
    nombre: 'Balneario de Guano',
    ciudad: 'Riobamba',
    direccion: 'A 8 km de Riobamba',
    descripcion: 'Balneario de aguas termales',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 3,
    imagen: 'https://img.goraymi.com/2021/05/21/e8ee7f8f94fd8f9665cede1c4cc810c4_xl.jpg'
  },
  {
    nombre: 'Nariz del Diablo',
    ciudad: 'Riobamba',
    direccion: 'A 45 km de Riobamba',
    descripcion: 'Famosa formación rocosa donde pasa el tren más difícil del mundo',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zig-zag%20nariz%20del%20diablo.jpg'
  },

  // El Oro (Machala)
  {
    nombre: 'Museo de la Bananera',
    ciudad: 'Machala',
    direccion: 'Avenida 25 de Junio',
    descripcion: 'Museo dedicado a la historia de la producción bananera',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Machala_capital_bananera_Ecuador.jpg'
  },
  {
    nombre: 'Playa de Jambelí',
    ciudad: 'Machala',
    direccion: 'A 30 km de Machala',
    descripcion: 'Hermosa playa del Pacífico con restaurantes y actividades acuáticas',
    tipo: 'Playa',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://img.goraymi.com/2021/01/24/1e2c84ee197f512a85bcffe43aa8eacb_xl.jpg'
  },
  {
    nombre: 'Parque Central de Machala',
    ciudad: 'Machala',
    direccion: 'Centro de Machala',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monumento%20a%20Juan%20Montalvo%20.jpg'
  },
  {
    nombre: 'Malecón de Puerto Bolívar',
    ciudad: 'Machala',
    direccion: 'Puerto Bolívar',
    descripcion: 'Malecón con vista al mar y restaurantes de mariscos',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/El%20Oro%20Machala%20Puerto%20Bolivar%20063%20%2829323748943%29.jpg'
  },
  {
    nombre: 'Isla de Jambelí',
    ciudad: 'Machala',
    direccion: 'A 30 km de Machala',
    descripcion: 'Isla con playas, manglares y vida silvestre',
    tipo: 'Playa',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Archipi%C3%A9lago%20de%20Jambel%C3%AD.jpg'
  },

  // Esmeraldas (Esmeraldas)
  {
    nombre: 'Playa de Atacames',
    ciudad: 'Esmeraldas',
    direccion: 'A 30 km de Esmeraldas',
    descripcion: 'Famosa playa con ambiente turístico y vida nocturna',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Atacames%20playa%20beach%201994.jpg'
  },
  {
    nombre: 'Reserva Ecológica Manglares Cayapas-Mataje',
    ciudad: 'Esmeraldas',
    direccion: 'Cantón San Lorenzo',
    descripcion: 'Reserva de manglares con gran biodiversidad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Comisi%C3%B3n%20de%20Verificaci%C3%B3n%20de%20la%20OEA%20%283364267398%29.jpg'
  },
  {
    nombre: 'Playa de Súa',
    ciudad: 'Esmeraldas',
    direccion: 'A 25 km de Esmeraldas',
    descripcion: 'Playa tranquila ideal para familias',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/S%C3%BAa.jpg'
  },
  {
    nombre: 'Playa de Tonsupa',
    ciudad: 'Esmeraldas',
    direccion: 'A 28 km de Esmeraldas',
    descripcion: 'Playa con olas para surf y ambiente relajado',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Skyline%20de%20Tonsupa.jpg'
  },
  {
    nombre: 'Malecón de Esmeraldas',
    ciudad: 'Esmeraldas',
    direccion: 'Malecón de Esmeraldas',
    descripcion: 'Paseo marítimo con restaurantes y vista al océano',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 24:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Malecon%20Playa%20Las%20Palmas%20Esmeraldas.jpg'
  },
  {
    nombre: 'Museo de Esmeraldas',
    ciudad: 'Esmeraldas',
    direccion: 'Centro de Esmeraldas',
    descripcion: 'Museo con historia y cultura afroecuatoriana',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20y%20Centro%20Cultural%20Esmeraldas.jpg'
  },

  // Guayas (Guayaquil)
  {
    nombre: 'Malecón 2000',
    ciudad: 'Guayaquil',
    direccion: 'Malecón Simón Bolívar',
    descripcion: 'Paseo marítimo renovado con museos, restaurantes y jardines',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 24:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Malecon%202000%2C%20Guayaquil%2C%20Ecuador%20%2819057770996%29.jpg'
  },
  {
    nombre: 'Las Peñas',
    ciudad: 'Guayaquil',
    direccion: 'Barrio Las Peñas',
    descripcion: 'Barrio histórico con casas coloridas y vista panorámica',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Las%20Pe%C3%B1as%20de%20Guayaquil.jpg'
  },
  {
    nombre: 'Parque Histórico Guayaquil',
    ciudad: 'Guayaquil',
    direccion: 'Vía Samborondón',
    descripcion: 'Parque temático sobre la historia y cultura de la costa',
    tipo: 'Parque',
    horario: 'Miércoles a Domingo: 9:00 - 16:30',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20Hist%C3%B3rico%20Guayaquil%20-%20Edificios%20%281%29.JPG'
  },
  {
    nombre: 'Parque Seminario (Iguana Park)',
    ciudad: 'Guayaquil',
    direccion: 'Calle Chimborazo y 10 de Agosto',
    descripcion: 'Parque con iguanas libres, monumento a Simón Bolívar',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ecuador%20-%20Guayaquil%20-%20Parque%20seminario%20-%20Parque%20de%20las%20iguanas.jpg'
  },
  {
    nombre: 'Museo Antropológico y de Arte Contemporáneo',
    ciudad: 'Guayaquil',
    direccion: 'Malecón y Loja',
    descripcion: 'MAAC con arte precolombino y contemporáneo',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 10:00 - 18:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20Antropologico%20y%20de%20Arte%20Contemporaneo.jpg'
  },
  {
    nombre: 'Cerro Santa Ana',
    ciudad: 'Guayaquil',
    direccion: 'Barrio Las Peñas',
    descripcion: 'Cerro con escalinatas, mirador y restaurantes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cerro%20Santa%20Ana%20desde%20el%20Malec%C3%B3n%202000.jpg'
  },
  {
    nombre: 'Jardín Botánico de Guayaquil',
    ciudad: 'Guayaquil',
    direccion: 'Avenida Francisco de Orellana',
    descripcion: 'Jardín botánico con flora nativa de la costa',
    tipo: 'Parque',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://media-cdn.tripadvisor.com/media/photo-f/05/53/37/33/botanical-garden-of-guayaquil.jpg'
  },
  {
    nombre: 'Museo Municipal de Guayaquil',
    ciudad: 'Guayaquil',
    direccion: 'Calle Sucre entre Chile y Pedro Carbo',
    descripcion: 'Museo con historia de Guayaquil y la independencia',
    tipo: 'Museo',
    horario: 'Martes a Sábado: 9:00 - 17:30',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20municipal%20de%20Guayaquil%202020.jpg'
  },

  // Imbabura (Ibarra)
  {
    nombre: 'Laguna de Yahuarcocha',
    ciudad: 'Ibarra',
    direccion: 'A 3 km de Ibarra',
    descripcion: 'Laguna andina ideal para deportes acuáticos y paseos',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Laguna%20de%20Yahuarcocha%2C%20La%20Dolorosa%20del%20Priorato%2C%20Ecuador%2C%202015-07-21%2C%20DD%2030.JPG'
  },
  {
    nombre: 'Centro Histórico de Ibarra',
    ciudad: 'Ibarra',
    direccion: 'Centro de Ibarra',
    descripcion: 'Centro histórico con arquitectura blanca colonial',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ibarra%20airview%202018.png'
  },
  {
    nombre: 'Laguna de Cuicocha',
    ciudad: 'Ibarra',
    direccion: 'A 14 km de Cotacachi',
    descripcion: 'Laguna volcánica en cráter con islas, ideal para paseos en bote',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Laguna%20de%20Cuicocha%2002.jpg'
  },
  {
    nombre: 'Mercado de Otavalo',
    ciudad: 'Otavalo',
    direccion: 'Plaza de Ponchos, Otavalo',
    descripcion: 'Famoso mercado indígena más grande de Sudamérica',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 7:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Otavalo%201985%20006.png'
  },
  {
    nombre: 'Laguna de San Pablo',
    ciudad: 'Otavalo',
    direccion: 'A 3 km de Otavalo',
    descripcion: 'Laguna andina con vista al volcán Imbabura',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lago%20San%20Pablo.jpg'
  },
  {
    nombre: 'Parque Condor',
    ciudad: 'Otavalo',
    direccion: 'A 10 km de Otavalo',
    descripcion: 'Centro de rescate y exhibición de aves rapaces',
    tipo: 'Parque',
    horario: 'Martes a Domingo: 9:30 - 17:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20del%20Condor%20Ecuador%201260.jpg'
  },
  {
    nombre: 'Museo de las Culturas',
    ciudad: 'Ibarra',
    direccion: 'Calle Sucre y Oviedo',
    descripcion: 'Museo con historia y cultura de Imbabura',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20de%20las%20Culturas%20Abor%C3%ADgenes%20-%20interior.jpg'
  },

  // Loja (Loja)
  {
    nombre: 'Parque Nacional Podocarpus',
    ciudad: 'Loja',
    direccion: 'A 8 km de Loja',
    descripcion: 'Parque nacional con bosques nublados y gran biodiversidad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Podocarpus%20Ecuador216.JPG'
  },
  {
    nombre: 'Centro Histórico de Loja',
    ciudad: 'Loja',
    direccion: 'Centro de Loja',
    descripcion: 'Centro histórico con iglesias coloniales y arquitectura tradicional',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Loja-centro-calle.png'
  },
  {
    nombre: 'Catedral de Loja',
    ciudad: 'Loja',
    direccion: 'Parque Central de Loja',
    descripcion: 'Catedral neoclásica del siglo XIX',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Main%20altar%20of%20the%20Catedral%20Cat%C3%B3lica%20de%20Loja%2C%20Ecuador.jpg'
  },
  {
    nombre: 'Puerta de la Ciudad',
    ciudad: 'Loja',
    direccion: 'Avenida 8 de Diciembre',
    descripcion: 'Monumento arquitectónico símbolo de Loja',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Puerta%20de%20la%20Ciudad%20de%20Loja%20Ecuador%201.jpg'
  },
  {
    nombre: 'Museo de la Música',
    ciudad: 'Loja',
    direccion: 'Calle Bernardo Valdivieso',
    descripcion: 'Museo dedicado a los músicos lojanos',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://www.loja.gob.ec/files/noticias/2023/05/3_0.jpg'
  },
  {
    nombre: 'Mirador de Loja',
    ciudad: 'Loja',
    direccion: 'Cerro de Loja',
    descripcion: 'Mirador con vista panorámica de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Loja%2C%20Ecuador%20-%20panoramio%20%2826%29.jpg'
  },

  // Los Ríos (Babahoyo)
  {
    nombre: 'Museo de Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Centro de Babahoyo',
    descripcion: 'Museo con historia de la provincia y cultura local',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://www.lahora.com.ec/contenido/2018/10/este-mes-se-abriria-el-museo-de-babahoyo--imagen-1-_2018101092332.jpg'
  },
  {
    nombre: 'Parque Central de Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Centro de Babahoyo',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/BABAHOYO%20%2834910311962%29.jpg'
  },
  {
    nombre: 'Río Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Malecón de Babahoyo',
    descripcion: 'Río principal con paseo fluvial y restaurantes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/R%C3%ADo%20Babahoyo.jpg'
  },
  {
    nombre: 'Catedral de Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Parque Central',
    descripcion: 'Catedral moderna con arquitectura única',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral%20de%20Babahoyo.jpg'
  },

  // Manabí (Portoviejo)
  {
    nombre: 'Playa de Manta',
    ciudad: 'Manta',
    direccion: 'Malecón de Manta',
    descripcion: 'Playa urbana con malecón, restaurantes y vida nocturna',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa%20de%20Manta.jpg'
  },
  {
    nombre: 'Parque Nacional Machalilla',
    ciudad: 'Puerto López',
    direccion: 'A 30 km de Puerto López',
    descripcion: 'Parque nacional con playas, bosques secos y arqueología',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ecuador%20Nationalpark%20Machalilla%201.JPG'
  },
  {
    nombre: 'Playa de Los Frailes',
    ciudad: 'Puerto López',
    direccion: 'Parque Nacional Machalilla',
    descripcion: 'Una de las playas más hermosas del Ecuador',
    tipo: 'Playa',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Panoramica%20Playa%20de%20los%20Frailes.jpg'
  },
  {
    nombre: 'Isla de la Plata',
    ciudad: 'Puerto López',
    direccion: 'A 40 km de Puerto López',
    descripcion: 'Isla conocida como "Galápagos de los pobres" con aves y ballenas',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 15,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Isladelaplata.JPG'
  },
  {
    nombre: 'Centro Histórico de Portoviejo',
    ciudad: 'Portoviejo',
    direccion: 'Centro de Portoviejo',
    descripcion: 'Centro histórico con arquitectura tradicional manabita',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Calle%20Olmedo.JPG'
  },
  {
    nombre: 'Museo de Manta',
    ciudad: 'Manta',
    direccion: 'Avenida Malecón',
    descripcion: 'Museo con arqueología de la cultura Manteña',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Coat%20of%20arms%20of%20Ecuador%20Exhibited%20in%20the%20CANCEBI%20Museum%20Manta%20-Ecuador%20Jan%202025.jpg'
  },
  {
    nombre: 'Playa de Crucita',
    ciudad: 'Portoviejo',
    direccion: 'A 30 km de Portoviejo',
    descripcion: 'Playa tranquila ideal para parapente',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parapente%20Crucita.jpg'
  },
  {
    nombre: 'Montecristi',
    ciudad: 'Montecristi',
    direccion: 'A 15 km de Manta',
    descripcion: 'Ciudad histórica donde se confeccionan los sombreros de paja toquilla',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Montecristi%20Main%20square.JPG'
  },

  // Morona Santiago (Macas)
  {
    nombre: 'Catedral de Macas',
    ciudad: 'Macas',
    direccion: 'Centro de Macas',
    descripcion: 'Catedral moderna con arquitectura única en la Amazonía',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral%20de%20Nuestra%20Se%C3%B1ora%20Pur%C3%ADsima%20de%20Macas.jpg'
  },
  {
    nombre: 'Mirador de Macas',
    ciudad: 'Macas',
    direccion: 'Cerro de Macas',
    descripcion: 'Mirador con vista panorámica de la ciudad y la selva',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Virgen%20del%20Qu%C3%ADlamo.jpg'
  },
  {
    nombre: 'Parque Central de Macas',
    ciudad: 'Macas',
    direccion: 'Centro de Macas',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Plaza%20C%C3%ADvica%20de%20Macas.jpg'
  },
  {
    nombre: 'Río Upano',
    ciudad: 'Macas',
    direccion: 'Río Upano',
    descripcion: 'Río principal ideal para paseos y actividades acuáticas',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rio_Upano%2C_Logro%C3%B1o.JPG'
  },
  {
    nombre: 'Cascada de Chiguaza',
    ciudad: 'Macas',
    direccion: 'A 25 km de Macas',
    descripcion: 'Hermosa cascada en medio de la selva amazónica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada_Chiguaza_Morona.jpg'
  },

  // Napo (Tena)
  {
    nombre: 'Parque Amazónico La Isla',
    ciudad: 'Tena',
    direccion: 'A 2 km de Tena',
    descripcion: 'Parque temático sobre la Amazonía ecuatoriana',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ama%20la%20Vida%20-%20Flickr%20-%20parque%20amazonico%20la%20isla%20tena%20napo%20%288227377138%29.jpg'
  },
  {
    nombre: 'Río Napo',
    ciudad: 'Tena',
    direccion: 'Río Napo',
    descripcion: 'Río principal de la Amazonía, ideal para rafting y paseos',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rio_Napo_in_Francisco_de_Orellana.jpg'
  },
  {
    nombre: 'Cascada de Latas',
    ciudad: 'Tena',
    direccion: 'A 15 km de Tena',
    descripcion: 'Cascada natural ideal para bañarse',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ama%20la%20Vida%20-%20Flickr%20-%20Cascada%20de%20Latas%20%281%29%20%288226308465%29.jpg'
  },
  {
    nombre: 'Malecón de Tena',
    ciudad: 'Tena',
    direccion: 'Malecón de Tena',
    descripcion: 'Paseo fluvial con vista a los ríos Tena y Pano',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Malec%C3%B3n%20de%20Tena.JPG'
  },
  {
    nombre: 'Parque Central de Tena',
    ciudad: 'Tena',
    direccion: 'Centro de Tena',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20Central%20de%20Tena.JPG'
  },
  {
    nombre: 'Cascada de San Rafael',
    ciudad: 'Tena',
    direccion: 'A 30 km de Tena',
    descripcion: 'Una de las cascadas más altas de la Amazonía',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/AMA%20Cascada%20de%20San%20Rafael%20limite%20provincial%20de%20Napo%20y%20Sucumb%C3%ADos%20%288227381138%29.jpg'
  },

  // Pastaza (Puyo)
  {
    nombre: 'Parque Botánico Las Orquídeas',
    ciudad: 'Puyo',
    direccion: 'A 5 km de Puyo',
    descripcion: 'Jardín botánico con orquídeas y plantas amazónicas',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 4,
    imagen: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjwfyrfUK_6dUsDVUgyq6NfKoDkVXTYiQfXwvDW6M34HVDTxsLpEzndSavF_Hr7PK9r5ryed2OBA_yMEL9JiK8tm9YXqFvCOoM5ETfl_3HJ7sGWrQsZnWbtIBrWJdNkoWRR2oi-YJLVlM0/s1600/parque%2Bbotanico%2Blas%2Borquideas....jpg'
  },
  {
    nombre: 'Cascada del Pailón del Diablo',
    ciudad: 'Puyo',
    direccion: 'A 20 km de Puyo',
    descripcion: 'Impresionante cascada en medio de la selva amazónica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pail%C3%B3n%20del%20Diablo%2C%20cerca%20a%20Ba%C3%B1os%2C%20Ecuador%20%283248%29.jpg'
  },
  {
    nombre: 'Parque Central de Puyo',
    ciudad: 'Puyo',
    direccion: 'Centro de Puyo',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20Central%20de%20Puyo%202022.jpg'
  },
  {
    nombre: 'Museo Etnográfico de Puyo',
    ciudad: 'Puyo',
    direccion: 'Centro de Puyo',
    descripcion: 'Museo con cultura de los pueblos amazónicos',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20Etno-arqueol%C3%B3gico%20de%20Puyo.jpg'
  },
  {
    nombre: 'Río Pastaza',
    ciudad: 'Puyo',
    direccion: 'Río Pastaza',
    descripcion: 'Río principal ideal para paseos y actividades acuáticas',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/R%C3%ADo%20Pastaza%20%2830340295112%29.jpg'
  },
  {
    nombre: 'Cascada de Hola Vida',
    ciudad: 'Puyo',
    direccion: 'A 15 km de Puyo',
    descripcion: 'Cascada natural en reserva ecológica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cascada%20Hola%20Vida%2C%20Pastaza.jpg'
  },

  // Pichincha (Quito)
  {
    nombre: 'Centro Histórico de Quito',
    ciudad: 'Quito',
    direccion: 'Centro Histórico de Quito',
    descripcion: 'Centro histórico más grande y mejor conservado de América Latina, Patrimonio de la Humanidad',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Historic%20Center%20of%20Quito%2C%20Centro%20hist%C3%B3rico%20de%20Quito%2C%20Ecuador%20South%20America.jpg'
  },
  {
    nombre: 'Mitad del Mundo',
    ciudad: 'Quito',
    direccion: 'San Antonio de Pichincha',
    descripcion: 'Monumento a la línea ecuatorial, donde se divide el hemisferio norte y sur',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 5,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/La%20Mitad%20del%20Mundo%2C%20Quito%2C%20Ecuador%20001.JPG'
  },
  {
    nombre: 'Teleférico de Quito',
    ciudad: 'Quito',
    direccion: 'Volcán Pichincha',
    descripcion: 'Teleférico que sube al volcán Pichincha con vistas espectaculares',
    tipo: 'Montaña',
    horario: 'Todos los días: 9:00 - 20:00',
    precioEntrada: 9,
    imagen: 'https://teleferico.com.ec/wp-content/uploads/2019/04/imagen_inicio3.jpg'
  },
  {
    nombre: 'Basílica del Voto Nacional',
    ciudad: 'Quito',
    direccion: 'Calle Venezuela y Carchi',
    descripcion: 'Basílica neogótica más grande de América, con gárgolas de fauna ecuatoriana',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bas%C3%ADlica%20del%20Voto%20Nacional%2C%20Quito%20-%206.jpg'
  },
  {
    nombre: 'Iglesia de la Compañía',
    ciudad: 'Quito',
    direccion: 'Calle García Moreno y Sucre',
    descripcion: 'Iglesia barroca con fachada de oro, joya del arte colonial',
    tipo: 'Monumento',
    horario: 'Lunes a Jueves: 9:30 - 18:30, Viernes: 9:30 - 17:30, Sábados: 9:30 - 16:30',
    precioEntrada: 5,
    imagen: 'https://www.viajesyfotografia.com/wp-content/uploads/2014/11/quito_9087_result.jpg'
  },
  {
    nombre: 'Museo de la Ciudad',
    ciudad: 'Quito',
    direccion: 'Calle García Moreno y Rocafuerte',
    descripcion: 'Museo sobre la historia de Quito desde la época precolombina',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20de%20la%20Ciudad%2C%20Quito%20%28exterior%29%20pic%20b1.JPG'
  },
  {
    nombre: 'Panecillo',
    ciudad: 'Quito',
    direccion: 'Cerro del Panecillo',
    descripcion: 'Mirador con monumento a la Virgen de Quito, vista panorámica',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/El%20Panecillo%20Quito%20Ecuador%201513.jpg'
  },
  {
    nombre: 'Capilla del Hombre',
    ciudad: 'Quito',
    direccion: 'Calle Mariano Calvache y Lorenzo Chávez',
    descripcion: 'Museo y capilla del artista Oswaldo Guayasamín',
    tipo: 'Museo',
    horario: 'Lunes a Domingo: 10:00 - 17:00',
    precioEntrada: 8,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/La%20Capilla%20del%20Hombre%2C%20Quito.jpg'
  },
  {
    nombre: 'Parque La Carolina',
    ciudad: 'Quito',
    direccion: 'Avenida Amazonas y Naciones Unidas',
    descripcion: 'Parque urbano más grande de Quito con lagos y áreas recreativas',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20La%20Carolina%2001%20-%20Quito.jpg'
  },
  {
    nombre: 'Museo Nacional del Ecuador',
    ciudad: 'Quito',
    direccion: 'Avenida Patria y 6 de Diciembre',
    descripcion: 'Museo con arte e historia del Ecuador',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20Nacional%20del%20Ecuador%20%28MUNA%29%2C%20ingreso.jpg'
  },

  // Tungurahua (Ambato)
  {
    nombre: 'Catedral de Ambato',
    ciudad: 'Ambato',
    direccion: 'Parque Montalvo',
    descripcion: 'Catedral neoclásica en el corazón de Ambato',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Catedral%20de%20Ambato.JPG'
  },
  {
    nombre: 'Museo de la Casa de Montalvo',
    ciudad: 'Ambato',
    direccion: 'Calle Bolívar y Montalvo',
    descripcion: 'Casa museo del escritor Juan Montalvo',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/T%20Ambato%200304%20001%20%2817311073201%29.jpg'
  },
  {
    nombre: 'Parque Montalvo',
    ciudad: 'Ambato',
    direccion: 'Centro de Ambato',
    descripcion: 'Parque central con monumento a Juan Montalvo',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vendedores%20ambulantes%20y%20peatones%20cerca%20del%20Parque%20Montalvo%20en%20Ambato%2C%20Ecuador.jpg'
  },
  {
    nombre: 'Mirador de Ambato',
    ciudad: 'Ambato',
    direccion: 'Cerro de Ambato',
    descripcion: 'Mirador con vista panorámica de la ciudad y volcanes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vista%20panor%C3%A1mica%20de%20la%20ciudad%20de%20Ambato%2C%20Tungurahua%2C%20Ecuador.jpg'
  },
  {
    nombre: 'Feria de Frutas y Flores',
    ciudad: 'Ambato',
    direccion: 'Centro de Ambato',
    descripcion: 'Feria tradicional más importante de Ambato (Febrero)',
    tipo: 'Centro Histórico',
    horario: 'Durante la feria: 8:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Desfile%20de%20Carnaval%2C%20Ambato%2C%20Ecuador%20%286816467590%29.jpg'
  },
  {
    nombre: 'Cascada de Agoyán',
    ciudad: 'Ambato',
    direccion: 'A 20 km de Ambato',
    descripcion: 'Cascada natural en zona rural',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 1,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tarabita%20-%20Cascada%20de%20Agoy%C3%A1n.JPG'
  },

  // Zamora Chinchipe (Zamora)
  {
    nombre: 'Cascada de San Francisco',
    ciudad: 'Zamora',
    direccion: 'A 15 km de Zamora',
    descripcion: 'Hermosa cascada en medio de la selva amazónica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 2,
    imagen: 'https://img.goraymi.com/2018/09/21/7eb6f60f431d802039cc8a2910eab850_xl.jpg'
  },
  {
    nombre: 'Parque Central de Zamora',
    ciudad: 'Zamora',
    direccion: 'Centro de Zamora',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zamora_Chinchipe_Ecuador.jpg'
  },
  {
    nombre: 'Río Zamora',
    ciudad: 'Zamora',
    direccion: 'Río Zamora',
    descripcion: 'Río principal ideal para paseos y actividades acuáticas',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/R%C3%ADo_Zamora.JPG'
  },
  {
    nombre: 'Cascada de El Chorro',
    ciudad: 'Zamora',
    direccion: 'A 10 km de Zamora',
    descripcion: 'Cascada natural en reserva ecológica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/El_Chorro_Zamora_Ecuador.jpg'
  },

  // Sucumbíos (Lago Agrio)
  {
    nombre: 'Reserva de Producción Faunística Cuyabeno',
    ciudad: 'Lago Agrio',
    direccion: 'A 60 km de Lago Agrio',
    descripcion: 'Reserva amazónica con lagunas y gran biodiversidad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ama%20la%20Vida%20-%20Flickr%20-%20Reserva%20de%20Producci%C3%B3n%20Faun%C3%ADstica%20Cuyabeno%20atardecer%20%288227376146%29.jpg'
  },
  {
    nombre: 'Laguna Grande de Cuyabeno',
    ciudad: 'Lago Agrio',
    direccion: 'Reserva Cuyabeno',
    descripcion: 'Laguna amazónica ideal para observación de delfines y aves',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Macrolobiumb%C3%A4ume%20in%20der%20Laguna%20Grande%2C%20Cuyabeno-Reservat.jpg'
  },
  {
    nombre: 'Parque Central de Lago Agrio',
    ciudad: 'Lago Agrio',
    direccion: 'Centro de Lago Agrio',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lago%20Agrio%20Ecuador.JPG'
  },
  {
    nombre: 'Río Aguarico',
    ciudad: 'Lago Agrio',
    direccion: 'Río Aguarico',
    descripcion: 'Río principal ideal para paseos y observación de fauna',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/R%C3%ADo_Aguarico.jpg'
  },
  {
    nombre: 'Laguna de Zancudococha',
    ciudad: 'Lago Agrio',
    direccion: 'Reserva Cuyabeno',
    descripcion: 'Laguna amazónica con gran diversidad de aves',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zancudococha%20III.JPG'
  },

  // Orellana (Francisco de Orellana)
  {
    nombre: 'Parque Nacional Yasuní',
    ciudad: 'Francisco de Orellana',
    direccion: 'A 100 km de Francisco de Orellana',
    descripcion: 'Parque nacional con la mayor biodiversidad del planeta',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon%C3%ADa%20Ecuador.jpg'
  },
  {
    nombre: 'Parque Central de Coca',
    ciudad: 'Francisco de Orellana',
    direccion: 'Centro de Francisco de Orellana',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://live.staticflickr.com/8199/8219503742_0aa7a63e59.jpg'
  },
  {
    nombre: 'Río Napo',
    ciudad: 'Francisco de Orellana',
    direccion: 'Río Napo',
    descripcion: 'Río principal de la Amazonía, ideal para paseos fluviales',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rio_Napo_in_Francisco_de_Orellana.jpg'
  },
  {
    nombre: 'Laguna de Añangu',
    ciudad: 'Francisco de Orellana',
    direccion: 'Parque Nacional Yasuní',
    descripcion: 'Laguna amazónica con torre de observación de aves',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dron%20de%20la%20Laguna%20A%C3%B1angu.jpg'
  },
  {
    nombre: 'Museo Arqueológico de Coca',
    ciudad: 'Francisco de Orellana',
    direccion: 'Centro de Francisco de Orellana',
    descripcion: 'Museo con arqueología de culturas amazónicas',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://macco.ec/wp-content/uploads/2019/06/Dise%C3%B1o-sin-t%C3%ADtulo-4.png'
  },

  // Santo Domingo de los Tsáchilas (Santo Domingo)
  {
    nombre: 'Parque Central de Santo Domingo',
    ciudad: 'Santo Domingo',
    direccion: 'Centro de Santo Domingo',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20Zaracay%202022.jpg'
  },
  {
    nombre: 'Museo Etnográfico Tsáchila',
    ciudad: 'Santo Domingo',
    direccion: 'Centro de Santo Domingo',
    descripcion: 'Museo sobre la cultura y tradiciones del pueblo Tsáchila',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://www.lahora.com.ec/contenido/2018/04/el-museo-etnografico-muestra-la-cultura-tsachila-imagen-1-_20180415091249.jpg'
  },
  {
    nombre: 'Comunidad Tsáchila',
    ciudad: 'Santo Domingo',
    direccion: 'A 15 km de Santo Domingo',
    descripcion: 'Comunidad indígena con tours culturales y tradiciones',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 5,
    imagen: 'https://img.goraymi.com/2016/08/21/106ac6cb77ea3a6a7c6843e9cd78b083_xl.jpg'
  },
  {
    nombre: 'Cascada de San Jacinto',
    ciudad: 'Santo Domingo',
    direccion: 'A 20 km de Santo Domingo',
    descripcion: 'Cascada natural en zona de bosque húmedo',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 2,
    imagen: 'https://image.jimcdn.com/app/cms/image/transf/dimension%3D673x10000%3Aformat%3Djpg/path/s02807a7b6a117d20/image/i96940c73cc451362/version/1475163999/cascada-de-san-jacinto-en-ventanas.jpg'
  },
  {
    nombre: 'Río Toachi',
    ciudad: 'Santo Domingo',
    direccion: 'Río Toachi',
    descripcion: 'Río ideal para actividades acuáticas y paseos',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mirador%20del%20ca%C3%B1on%20del%20r%C3%ADo%20Toachi%20Ecuador%201631.jpg'
  },

  // Santa Elena (Santa Elena)
  {
    nombre: 'Museo Los Amantes de Sumpa',
    ciudad: 'Santa Elena',
    direccion: 'Avenida Principal',
    descripcion: 'Museo arqueológico con restos de la cultura Las Vegas',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20Amantes%20de%20Sumpa.jpg'
  },
  {
    nombre: 'Playa de Salinas',
    ciudad: 'Salinas',
    direccion: 'Malecón de Salinas',
    descripcion: 'Playa turística con hoteles, restaurantes y actividades acuáticas',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Salinas%20banner.jpg'
  },
  {
    nombre: 'Playa de Montañita',
    ciudad: 'Montañita',
    direccion: 'A 20 km de Santa Elena',
    descripcion: 'Famosa playa para surf y vida bohemia',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa%20Monta%C3%B1ita.jpg'
  },
  {
    nombre: 'Playa de Ayangue',
    ciudad: 'Ayangue',
    direccion: 'A 15 km de Santa Elena',
    descripcion: 'Playa tranquila ideal para familias y snorkel',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa%20Rosada-%20Ayangue.jpg'
  },
  {
    nombre: 'Parque Central de Santa Elena',
    ciudad: 'Santa Elena',
    direccion: 'Centro de Santa Elena',
    descripcion: 'Parque central con monumentos y áreas verdes',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Parque%20Central%20de%20Santa%20Elena.jpg'
  },
  {
    nombre: 'Museo de Ballenas',
    ciudad: 'Salinas',
    direccion: 'Malecón de Salinas',
    descripcion: 'Museo sobre ballenas jorobadas y vida marina',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo%20Nacional%20de%20la%20Ballena.jpg'
  },

  // Nuevos lugares solicitados para CulturalTrip
  {
    nombre: 'Museo de las Conceptas',
    ciudad: 'Cuenca',
    direccion: 'Centro de Cuenca',
    descripcion: 'Museo de arte religioso colonial',
    tipo: 'Museo',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 2,
    imagen: 'https://cultura.cuenca.gob.ec/wp-content/uploads/2025/03/MuseoConceptas-visitcuenca-Arte-religioso-3-1024x682-1.jpeg'
  },
  {
    nombre: 'Mirador de Turi',
    ciudad: 'Cuenca',
    direccion: 'Parroquia Turi',
    descripcion: 'Mirador panorámico de Cuenca',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQapzMV4gCq9UuR2Il6vEZR6_55_jEyER82LA&s'
  },
  {
    nombre: 'Mirador de Macas',
    ciudad: 'Macas',
    direccion: 'Mirador de la ciudad de Macas',
    descripcion: 'Mirador con vista de Macas y sus alrededores',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://static.mmorona.gob.ec/tourism.media.bucket/gallery/X52A0011.JPG'
  },
  {
    nombre: 'Cascada Chiguaza',
    ciudad: 'Macas',
    direccion: 'Vía Macas - Chiguaza',
    descripcion: 'Cascada natural en Morona Santiago',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp-DPF2TjxutxMQ7laKIyTq19Jf6gP2k2MuQ&s'
  },
  {
    nombre: 'Centro Histórico de Quito',
    ciudad: 'Quito',
    direccion: 'Centro Histórico de Quito',
    descripcion: 'Patrimonio cultural de la humanidad',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://www.kuodatravel.com/wp-content/uploads/2024/10/Iquito-Colonial-Churches.jpg'
  },
  {
    nombre: 'Panecillo',
    ciudad: 'Quito',
    direccion: 'Cerro El Panecillo',
    descripcion: 'Mirador emblemático de Quito',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 1,
    imagen: 'https://ec.viajandox.com/uploads/Virgen%20de%20El%20Panecillo_1.jpg'
  },
  {
    nombre: 'Basílica del Voto Nacional',
    ciudad: 'Quito',
    direccion: 'Calle Venezuela y Carchi',
    descripcion: 'Basílica neogótica ícono de Quito',
    tipo: 'Monumento',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://cdn.pixabay.com/photo/2017/03/24/08/43/quito-2170516_640.jpg'
  },
  {
    nombre: 'Parque La Carolina',
    ciudad: 'Quito',
    direccion: 'Av. Amazonas y Naciones Unidas',
    descripcion: 'Parque urbano principal de Quito',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://dolcevita.ec/wp-content/uploads/2020/12/TEMP-La-Carolina-F01-1.jpg'
  },
  {
    nombre: 'Frontera Rumichaca',
    ciudad: 'Tulcán',
    direccion: 'Puente Internacional de Rumichaca',
    descripcion: 'Paso fronterizo entre Ecuador y Colombia',
    tipo: 'Monumento',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://imagenes.expreso.ec/files/image_1200_675/uploads/2021/07/05/60e33cc9cf195.jpeg'
  },
  {
    nombre: 'Cementerio de Tulcán',
    ciudad: 'Tulcán',
    direccion: 'Centro de Tulcán',
    descripcion: 'Cementerio patrimonial con esculturas en ciprés',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTd6D7HUyvUTk865sfKzxfp2PkwO51WAk4R6A&s'
  },
  {
    nombre: 'Playa Crucita',
    ciudad: 'Portoviejo',
    direccion: 'Crucita, Portoviejo',
    descripcion: 'Playa y destino para parapente',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://img.goraymi.com/2021/01/30/e8c5f6430567267d3c0bf1b83edc5154_xl.jpg'
  },
  {
    nombre: 'Centro Histórico de Portoviejo',
    ciudad: 'Portoviejo',
    direccion: 'Centro de Portoviejo',
    descripcion: 'Zona histórica y comercial de la ciudad',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe7TwjMB1kbrwzwy8gNnfbWfzUbwLMORtgNw&s'
  },
  {
    nombre: 'Las Peñas',
    ciudad: 'Guayaquil',
    direccion: 'Barrio Las Peñas',
    descripcion: 'Barrio histórico colorido de Guayaquil',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://elcomercio.pe/resizer/sqxSyWJe1KSKHUDV21DdveL3ceg=/980x528/smart/filters:format(jpeg):quality(75)/arc-anglerfish-arc2-prod-elcomercio.s3.amazonaws.com/public/KUXVSPHKIRGQ5ECYLXJA7PZT2Q.jpg'
  },
  {
    nombre: 'Jardín Botánico de Guayaquil',
    ciudad: 'Guayaquil',
    direccion: 'Av. Francisco de Orellana',
    descripcion: 'Jardín botánico con flora nativa',
    tipo: 'Parque',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://www.shutterstock.com/shutterstock/photos/1390871801/display_1500/stock-photo-guayaquil-ecuador-january-entrance-to-guayaquil-botanical-garden-jard-n-bot-nico-de-1390871801.jpg'
  },
  {
    nombre: 'Malecón de Guayaquil',
    ciudad: 'Guayaquil',
    direccion: 'Malecón Simón Bolívar',
    descripcion: 'Paseo turístico principal de Guayaquil',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 24:00',
    precioEntrada: 0,
    imagen: 'https://malecon.org.ec/public/turismo_atractivos/28ccd44f43ec4172467fcb0307f39dd3.jpg'
  },
  {
    nombre: 'Cerro Santa Ana',
    ciudad: 'Guayaquil',
    direccion: 'Barrio Las Peñas',
    descripcion: 'Escalinatas y mirador de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://www.theparkhotel.ec/wp-content/uploads/2022/07/blog-guayaquil-theparkhotel-1-1024x576.jpg'
  },
  {
    nombre: 'Parque Nacional Machalilla',
    ciudad: 'Puerto López',
    direccion: 'Cantón Puerto López',
    descripcion: 'Parque nacional con playas y biodiversidad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 10,
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Comuna-salango1.jpg'
  },
  {
    nombre: 'Mirador de Guaranda',
    ciudad: 'Guaranda',
    direccion: 'Mirador de Guaranda',
    descripcion: 'Vista panorámica de Guaranda y sus montañas',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://www.salinasdeguaranda.com/wp-content/uploads/2020/10/yagui01.jpg'
  },
  {
    nombre: 'Cascada de Salinas',
    ciudad: 'Guaranda',
    direccion: 'Parroquia Salinas',
    descripcion: 'Cascada natural de agua fría',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrXIrhf8qCO3UZs2EXI7SteY3I1Cvri1jX2w&s'
  },
  {
    nombre: 'Cascada San Vicente',
    ciudad: 'Guaranda',
    direccion: 'San Vicente, Guaranda',
    descripcion: 'Cascada natural en entorno andino',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQosrAmoygSOEyxaASP9ay1lf07f2M6NlR5yg&s'
  },
  {
    nombre: 'Museo Concepción',
    ciudad: 'Riobamba',
    direccion: 'Centro de Riobamba',
    descripcion: 'Museo patrimonial de arte religioso',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaIVHMxKjAqSPR_4S-WRVArMWu5IIdknhf6A&s'
  },
  {
    nombre: 'Balneario de Guano',
    ciudad: 'Riobamba',
    direccion: 'Guano, Riobamba',
    descripcion: 'Balneario y zona recreativa',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 3,
    imagen: 'https://mundialmedios.com/wp-content/uploads/2022/07/LOS-ELENES.jpg'
  },
  {
    nombre: 'Volcán Chimborazo',
    ciudad: 'Riobamba',
    direccion: 'Reserva Chimborazo',
    descripcion: 'Volcán más alto del Ecuador',
    tipo: 'Montaña',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 5,
    imagen: 'https://www.civitatis.com/f/ecuador/riobamba/senderismo-volcan-chimborazo-589x392.jpg'
  },
  {
    nombre: 'Centro Histórico de Riobamba',
    ciudad: 'Riobamba',
    direccion: 'Centro de Riobamba',
    descripcion: 'Zona histórica de la ciudad de Riobamba',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9oiYsWAniNBlWSET4lOXAzQ3C8aNgWik7hg&s'
  },
  {
    nombre: 'Puerto Jeli',
    ciudad: 'Santa Rosa',
    direccion: 'Puerto Jeli, Santa Rosa',
    descripcion: 'Zona gastronómica y turística costera',
    tipo: 'Playa',
    horario: 'Todos los días: 8:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://lh4.googleusercontent.com/proxy/r_Mk3meI6Cb0ZmJXQSkOICXA6or2jiKvf_2s6cxrvlHfcCWoz9_u3JyYoJwh6P284KMNwVJUli9Djr3oeZ-dIwhm_rR56wpN12L3HZrvyA'
  },
  {
    nombre: 'Laguna Tembaldera',
    ciudad: 'Santa Rosa',
    direccion: 'Santa Rosa, El Oro',
    descripcion: 'Laguna y humedal de importancia ecológica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://img.goraymi.com/2018/06/04/e9f5e7855754ff83058d26d45fd7fe3b_xl.jpg'
  },
  {
    nombre: 'Parque Central Machala',
    ciudad: 'Machala',
    direccion: 'Centro de Machala',
    descripcion: 'Parque central y punto cívico de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Machala_-_parque_central_de_noche.jpg'
  },
  {
    nombre: 'Río Toachi',
    ciudad: 'Santo Domingo',
    direccion: 'Santo Domingo de los Tsáchilas',
    descripcion: 'Río de atractivo natural y recreativo',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg1AVfsHxOB1QbDKcPWDrcnT8LDVzCPNY_Aw&s'
  },
  {
    nombre: 'Museo Etnográfico Tsáchila',
    ciudad: 'Santo Domingo',
    direccion: 'Centro de Santo Domingo',
    descripcion: 'Museo de la cultura Tsáchila',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://www.larepublica.ec/wp-content/uploads/2011/08/Museo-EtnograficoTsachila-Santo-Domingo-Quevedo-tradiciones_ECMIMA20110815_0107_1.jpg'
  },
  {
    nombre: 'Playa de Salinas',
    ciudad: 'Salinas',
    direccion: 'Malecón de Salinas',
    descripcion: 'Playa principal del cantón Salinas',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://imagenes.expreso.ec/files/image_1200_675/uploads/2023/01/21/63cc276df0262.jpeg'
  },
  {
    nombre: 'Museo de Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Centro de Babahoyo',
    descripcion: 'Museo histórico de Babahoyo',
    tipo: 'Museo',
    horario: 'Lunes a Viernes: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://img.goraymi.com/2018/06/05/c42a3ae82c3adfbcf1158f082ee813b4_md.jpg'
  },
  {
    nombre: 'Parque Central de Babahoyo',
    ciudad: 'Babahoyo',
    direccion: 'Centro de Babahoyo',
    descripcion: 'Parque principal de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW-SJlv3rgSnPAtCwQNB5lwhjtUce-GeiwLw&s'
  },
  {
    nombre: 'Cascada San Jacinto',
    ciudad: 'Ventanas',
    direccion: 'Cantón Ventanas',
    descripcion: 'Cascada turística de Ventanas',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://ventanas.gob.ec/wp-content/uploads/2022/02/CASCADA-SAN-JACINTO-2.jpg'
  },
  {
    nombre: 'Río Oncebi',
    ciudad: 'Ventanas',
    direccion: 'Cantón Ventanas',
    descripcion: 'Zona recreativa de playa de río',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://ventanas.gob.ec/wp-content/uploads/2022/02/PLAYA-RIO-ONCEBI.jpg'
  },
  {
    nombre: 'Cascada de Chiviaza',
    ciudad: 'Limon Indanza',
    direccion: 'Limon Indanza',
    descripcion: 'Cascada natural en zona amazónica',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWkkkEIkqtf51OO5lfzZNPDVjd_4301WdBEw&s'
  },
  {
    nombre: 'Cascadas Coloradas',
    ciudad: 'Limon Indanza',
    direccion: 'Limon Indanza',
    descripcion: 'Complejo de cascadas en la selva',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://media-cdn.tripadvisor.com/media/photo-s/15/b0/4a/5a/cascadas-coloradas-en.jpg'
  },
  {
    nombre: 'Ñatos',
    ciudad: 'Limon Indanza',
    direccion: 'Limon Indanza',
    descripcion: 'Atractivo natural local de Limon Indanza',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTD73lcrlth1lO-xQzewi5yoZTsdT_xM9sW3g&s'
  },
  {
    nombre: 'Centro de Limon',
    ciudad: 'Limon Indanza',
    direccion: 'Centro de Limon Indanza',
    descripcion: 'Centro urbano del cantón Limon Indanza',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtodcJh7jNHX98rme0Qm2LwOEANdsvU-SNJw&s'
  },
  {
    nombre: 'Cascada San Francisco',
    ciudad: 'Zamora',
    direccion: 'Zamora',
    descripcion: 'Cascada natural de la provincia',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLdLQwLnT284PCXIQB5D5fT9Tl2ntDqqLc1g&s'
  },
  {
    nombre: 'Parque Central de Zamora',
    ciudad: 'Zamora',
    direccion: 'Centro de Zamora',
    descripcion: 'Parque central de Zamora',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://www.turismo.gob.ec/wp-content/uploads/2021/10/ecuador-FABN8047_trip7.jpeg'
  },
  {
    nombre: 'Parque Montalvo',
    ciudad: 'Ambato',
    direccion: 'Centro de Ambato',
    descripcion: 'Parque cívico central de Ambato',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://img.goraymi.com/2019/08/08/74c9a337c7fbdbfbb7e1c67d00a95e99_xl.jpg'
  },
  {
    nombre: 'Feria de Frutas y Flores',
    ciudad: 'Ambato',
    direccion: 'Ambato',
    descripcion: 'Fiesta tradicional de Ambato',
    tipo: 'Centro Histórico',
    horario: 'Temporada de feria',
    precioEntrada: 0,
    imagen: 'https://www.larepublica.ec/wp-content/uploads/2020/01/Ambato-600x381.jpg'
  },
  {
    nombre: 'Catedral de Ambato',
    ciudad: 'Ambato',
    direccion: 'Centro de Ambato',
    descripcion: 'Catedral principal de Ambato',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/CATEDRAL_DE_AMBATO.png'
  },
  {
    nombre: 'Museo Casa Montalvo',
    ciudad: 'Ambato',
    direccion: 'Centro de Ambato',
    descripcion: 'Museo dedicado a Juan Montalvo',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://www.elcomercio.com/wp-content/uploads/2021/07/casamontalvo.jpg'
  },
  {
    nombre: 'Malecón de Esmeraldas',
    ciudad: 'Esmeraldas',
    direccion: 'Malecón de Esmeraldas',
    descripcion: 'Paseo turístico frente al mar',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdcTe6vtV09ZBFH6JToznjv8gwj79RibirqQ&s'
  },
  {
    nombre: 'Mirador de Ingapirca',
    ciudad: 'Cañar',
    direccion: 'Ingapirca, Cañar',
    descripcion: 'Mirador del complejo arqueológico',
    tipo: 'Parque',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 6,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfd2VbDfdMMlTFfY9gLZdIVQpSZVEvILUi5A&s'
  },
  {
    nombre: 'Centro de Azogues',
    ciudad: 'Azogues',
    direccion: 'Centro de Azogues',
    descripcion: 'Zona céntrica y patrimonial de Azogues',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPbn_y3G9OCPjrqYgTDDgPWL83nu7pgOAqIQ&s'
  },
  {
    nombre: 'Catedral de Azogues',
    ciudad: 'Azogues',
    direccion: 'Centro de Azogues',
    descripcion: 'Catedral principal de Azogues',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkFUQMp2r-lk47JgHILRQHLKwRWsQCaBkW-A&s'
  },
  {
    nombre: 'Volcán Tungurahua',
    ciudad: 'Baños',
    direccion: 'Baños de Agua Santa',
    descripcion: 'Volcán emblemático de la zona',
    tipo: 'Montaña',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Volc%C3%A1n_Tungurahua_el_Gigante_Negro.jpg/250px-Volc%C3%A1n_Tungurahua_el_Gigante_Negro.jpg'
  },
  {
    nombre: 'Santuario y Basílica de Baños',
    ciudad: 'Baños',
    direccion: 'Centro de Baños',
    descripcion: 'Santuario religioso principal de la ciudad',
    tipo: 'Monumento',
    horario: 'Todos los días: 7:00 - 19:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-5ptvGQWZrjTVL_FL_P4K4_Fy1BzB5i7b-w&s'
  },
  {
    nombre: 'Animal Park',
    ciudad: 'Baños',
    direccion: 'Baños de Agua Santa',
    descripcion: 'Parque temático y de aventura',
    tipo: 'Parque',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 5,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3vCe8D11i1BeqBKLKgCcb_1bL3QqhTGMYAg&s'
  },
  {
    nombre: 'Casa del Árbol',
    ciudad: 'Baños',
    direccion: 'Runtún, Baños',
    descripcion: 'Mirador famoso por el columpio del fin del mundo',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 2,
    imagen: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/c1/ba/09/that-famous-treehouse.jpg?w=900&h=500&s=1'
  },
  {
    nombre: 'Aldea Mágica Baños',
    ciudad: 'Baños',
    direccion: 'Baños de Agua Santa',
    descripcion: 'Atractivo turístico y cultural de Baños',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 9:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/47/89/e4/a-la-puesta-del-sol-el.jpg?w=900&h=-1&s=1'
  },
  {
    nombre: 'Ruta de las Cascadas',
    ciudad: 'Baños',
    direccion: 'Vía Baños - Puyo',
    descripcion: 'Ruta escénica con múltiples cascadas',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKjJwVltNXplg6jrNIs2lceDn7JuMcUDmEcA&s'
  },
  {
    nombre: 'Parque Aventura San Martin',
    ciudad: 'Baños',
    direccion: 'Baños de Agua Santa',
    descripcion: 'Parque de aventura y actividades extremas',
    tipo: 'Parque',
    horario: 'Todos los días: 9:00 - 18:00',
    precioEntrada: 5,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-U_m73K1d1b5955G1tZciHNzmCAre7ICzTg&s'
  },
  {
    nombre: 'Centro de Ibarra',
    ciudad: 'Ibarra',
    direccion: 'Centro de Ibarra',
    descripcion: 'Centro urbano de la ciudad blanca',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQC2PM-Jttfcb4SypmIr3Zy48I39W9bHF6siw&s'
  },
  {
    nombre: 'Yahuarcocha',
    ciudad: 'Ibarra',
    direccion: 'Laguna de Yahuarcocha',
    descripcion: 'Laguna icónica de Ibarra',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://www.ecuaparapente.com.ec/wp-content/uploads/2023/04/Ibarra-large.png'
  },
  {
    nombre: 'Mercado de Otavalo',
    ciudad: 'Otavalo',
    direccion: 'Plaza de Ponchos',
    descripcion: 'Mercado artesanal tradicional',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 7:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://www.metropolitan-touring.com/wp-content/uploads/2023/05/otavalo-market.webp'
  },
  {
    nombre: 'Lago San Pablo',
    ciudad: 'Otavalo',
    direccion: 'Otavalo',
    descripcion: 'Lago andino con vista al Imbabura',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://www.lahora.com.ec/__export/1744749210479/sites/lahora/img/2025/04/15/20250415_023328062_El_lago_San_Pablox_bellezas_y_leyendas.jpg'
  },
  {
    nombre: 'Cascada de Peguche',
    ciudad: 'Otavalo',
    direccion: 'Peguche, Otavalo',
    descripcion: 'Cascada y parque ceremonial andino',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKM-SX5ppzMr10FF8JuBGeApSvIodBmJbNBA&s'
  },
  {
    nombre: 'Centro Recreativo de Catamayo',
    ciudad: 'Catamayo',
    direccion: 'Catamayo, Loja',
    descripcion: 'Zona recreativa del cantón',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcS9ay9M1HTI5bPNL3lOfiIgND31vKAm9p-nVaaeyIjx1QeVNjm_'
  },
  {
    nombre: 'Mirador La Cruz',
    ciudad: 'Catamayo',
    direccion: 'Catamayo, Loja',
    descripcion: 'Mirador con vista de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSVh1B_G9ayTyL9MErcDhMJFf8_BavhyP1aVKdkGNu6uJpWf8H'
  },
  {
    nombre: 'Cascadas La Era El Tambo',
    ciudad: 'Catamayo',
    direccion: 'El Tambo, Catamayo',
    descripcion: 'Cascadas naturales del cantón',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeld2S9rdviJNQQK0UCFKvL8ITO8W-fJQDcA&s'
  },
  {
    nombre: 'Museo de Manta',
    ciudad: 'Manta',
    direccion: 'Malecón de Manta',
    descripcion: 'Museo histórico y arqueológico',
    tipo: 'Museo',
    horario: 'Martes a Domingo: 9:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://museos.culturaypatrimonio.gob.ec/redmuseos/images/museos/fachadas/manta1.jpg'
  },
  {
    nombre: 'Playa de Montañita',
    ciudad: 'Montañita',
    direccion: 'Montañita, Santa Elena',
    descripcion: 'Playa turística y de surf',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://turismo.ecuadors.live/wp-content/uploads/2024/04/montanita-ecuadorlife.webp'
  },
  {
    nombre: 'Centro de Montañita',
    ciudad: 'Montañita',
    direccion: 'Centro de Montañita',
    descripcion: 'Zona céntrica de bares y restaurantes',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://glampingsouth.com/wp-content/uploads/playa-montanita-ecuador.jpg'
  },
  {
    nombre: 'Playa de Atacames',
    ciudad: 'Atacames',
    direccion: 'Atacames, Esmeraldas',
    descripcion: 'Playa principal del cantón Atacames',
    tipo: 'Playa',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://i.ytimg.com/vi/89GMsGk7OEY/maxresdefault.jpg'
  },
  {
    nombre: 'Peñón Suicida',
    ciudad: 'Atacames',
    direccion: 'Atacames, Esmeraldas',
    descripcion: 'Mirador natural en la costa',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://ec.viajandox.com/uploads/attractive_3903.jpg'
  },
  {
    nombre: 'Centro Histórico de Zaruma',
    ciudad: 'Zaruma',
    direccion: 'Centro de Zaruma',
    descripcion: 'Centro patrimonial minero y arquitectónico',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://media-cdn.tripadvisor.com/media/photo-s/09/51/5c/e1/zaruma.jpg'
  },
  {
    nombre: 'Mina El Sexmo',
    ciudad: 'Zaruma',
    direccion: 'Zaruma, El Oro',
    descripcion: 'Mina turística histórica',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/df/7a/fd/entrada-a-la-mina.jpg?w=1200&h=-1&s=1'
  },
  {
    nombre: 'Mirador Cerro Pata Grande',
    ciudad: 'Piñas',
    direccion: 'Piñas, El Oro',
    descripcion: 'Mirador de altura de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://img.goraymi.com/2018/04/24/29bf1c63491fc0ed0706006a0e389028_xl.jpg'
  },
  {
    nombre: 'Reserva Buenaventura',
    ciudad: 'Piñas',
    direccion: 'Piñas, El Oro',
    descripcion: 'Reserva natural con gran biodiversidad',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 5,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8HAY_g46RTiPD4hQEnuMm6VVPLv11RFiwFQ&s'
  },
  {
    nombre: 'Monumento de la Paz Huaquillas',
    ciudad: 'Huaquillas',
    direccion: 'Huaquillas, El Oro',
    descripcion: 'Monumento representativo fronterizo',
    tipo: 'Monumento',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://ec.viajandox.com/uploads/Huaquillas_1.jpg'
  },
  {
    nombre: 'Parque Central Huaquillas',
    ciudad: 'Huaquillas',
    direccion: 'Centro de Huaquillas',
    descripcion: 'Parque principal de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/27/5a/0f/huaquillas.jpg?w=1200&h=-1&s=1'
  },
  {
    nombre: 'Frontera Ecuador-Perú',
    ciudad: 'Huaquillas',
    direccion: 'Paso fronterizo de Huaquillas',
    descripcion: 'Paso internacional entre Ecuador y Perú',
    tipo: 'Monumento',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://www.elcomercio.com/wp-content/uploads/2022/05/frontera-1.jpg'
  },
  {
    nombre: 'Centro de Vinces',
    ciudad: 'Vinces',
    direccion: 'Centro de Vinces',
    descripcion: 'Centro urbano histórico de Vinces',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://ec.viajandox.com/uploads/Vinces_1.jpg'
  },
  {
    nombre: 'Cristo de Vinces',
    ciudad: 'Vinces',
    direccion: 'Vinces, Los Ríos',
    descripcion: 'Monumento religioso de la ciudad',
    tipo: 'Monumento',
    horario: 'Todos los días: 8:00 - 20:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT38njMWoJ8QJUeiCSWdXG2Wlm3zdytoz_sqg&s'
  },
  {
    nombre: 'Malecón de Quevedo',
    ciudad: 'Quevedo',
    direccion: 'Malecón de Quevedo',
    descripcion: 'Paseo principal junto al río',
    tipo: 'Parque',
    horario: 'Todos los días: 6:00 - 22:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhVuRZ0lMvQuU4jPlJ0iq2JuRnF-em1kpPVw&s'
  },
  {
    nombre: 'Zoológico de Quevedo',
    ciudad: 'Quevedo',
    direccion: 'Quevedo, Los Ríos',
    descripcion: 'Parque zoológico de la ciudad',
    tipo: 'Parque',
    horario: 'Todos los días: 9:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://pbs.twimg.com/media/FQGxgxfXIAEOQrb.jpg'
  },
  {
    nombre: 'Centro de San Gabriel',
    ciudad: 'San Gabriel',
    direccion: 'Centro de San Gabriel',
    descripcion: 'Centro patrimonial de San Gabriel',
    tipo: 'Centro Histórico',
    horario: 'Todos los días: 24 horas',
    precioEntrada: 0,
    imagen: 'https://www.turisec.com/wp-content/uploads/2022/04/San-Gabriel.jpg'
  },
  {
    nombre: 'Laguna El Salado',
    ciudad: 'San Gabriel',
    direccion: 'San Gabriel, Carchi',
    descripcion: 'Laguna natural de altura',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://ec.viajandox.com/uploads/Laguna%20el%20Salado_1.jpg'
  },
  {
    nombre: 'Cañón El Empalme',
    ciudad: 'Gualaquiza',
    direccion: 'Gualaquiza, Morona Santiago',
    descripcion: 'Cañón y paisaje natural de la zona',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHGhmx3Y6iJE97kj2t94ZQCl6AWmls0X0qAg&s'
  },
  {
    nombre: 'Cascada La Dolorosa',
    ciudad: 'Gualaquiza',
    direccion: 'Gualaquiza, Morona Santiago',
    descripcion: 'Cascada turística de Gualaquiza',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYuEgdi0kr2Hc4E_f8qrZG8O-veFgV89p5rA&s'
  },
  {
    nombre: 'La Isla Perdida',
    ciudad: 'Gualaquiza',
    direccion: 'Gualaquiza, Morona Santiago',
    descripcion: 'Atractivo natural y recreativo',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK26L1-v7KU9IFsWDDcwOa6Tj5Rf2qMDz02Q&s'
  },
  {
    nombre: 'Florecimiento de Guayacanes',
    ciudad: 'Macará',
    direccion: 'Macará, Loja',
    descripcion: 'Evento natural estacional (enero-febrero)',
    tipo: 'Parque',
    horario: 'Temporada: 8:00 - 18:00',
    precioEntrada: 0,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYHwSgVGT0tmRW1fH_j5zuD7HQUgzVk-CLIA&s'
  },
  {
    nombre: 'Reserva Biológica Jorupe',
    ciudad: 'Macará',
    direccion: 'Macará, Loja',
    descripcion: 'Reserva ecológica de bosque seco',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 3,
    imagen: 'https://ec.viajandox.com/uploads/min_tour_465.jpg'
  },
  {
    nombre: 'Reserva Ecológica Manglares Cayapas Mataje',
    ciudad: 'San Lorenzo',
    direccion: 'San Lorenzo, Esmeraldas',
    descripcion: 'Reserva de manglares del norte del país',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 3,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_9poxGTMn7ytQ5XzE11kBD2DEgMdfiGCtOw&s'
  },
  {
    nombre: 'Isla La Tolita',
    ciudad: 'San Lorenzo',
    direccion: 'San Lorenzo, Esmeraldas',
    descripcion: 'Sitio arqueológico y natural costero',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 16:00',
    precioEntrada: 3,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbkq0f7QjrgzqZ0fP6hbgrhY6xVfIPJYuZ-w&s'
  },
  {
    nombre: 'Gran Cañón del Ñachiyacu',
    ciudad: 'Archidona',
    direccion: 'Archidona, Napo',
    descripcion: 'Cañón natural y zona de aventura',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 2,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy8mabn0jBAgjA-SCAXjFGmisjmAOMbU388w&s'
  },
  {
    nombre: 'Cascada Chicaña',
    ciudad: 'Yantzaza',
    direccion: 'Yantzaza, Zamora Chinchipe',
    descripcion: 'Cascada turística de la zona',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 17:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwDhexX59ITUAwEveQm-fAJZNZZrF9rn8UKg&s'
  },
  {
    nombre: 'Balneario 3 Quebradas',
    ciudad: 'Yantzaza',
    direccion: 'Yantzaza, Zamora Chinchipe',
    descripcion: 'Balneario natural recreativo',
    tipo: 'Parque',
    horario: 'Todos los días: 8:00 - 18:00',
    precioEntrada: 1,
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXQQtf37TT6bLR9FZ9iGBa5NVka_Z6RQY1Bg&s'
  }
];

function deduplicateLugaresTuristicos(items) {
  const seen = new Set();
  const result = [];

  // Recorremos de atrás hacia adelante para conservar el registro más reciente.
  for (let i = items.length - 1; i >= 0; i--) {
    const lugar = items[i] || {};
    const key = `${String(lugar.ciudad || '').trim().toLowerCase()}|${String(lugar.nombre || '').trim().toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(lugar);
    }
  }

  return result.reverse();
}

const lugaresTuristicos = deduplicateLugaresTuristicos(lugaresTuristicosRaw);

// Función helper para obtener precio y duración basado en ciudades
function getPrecioYDuracion(from, to) {
  // Definir distancias aproximadas y precios
  const rutas = {
    // Rutas largas (Quito/Guayaquil a otras ciudades principales)
    'Quito-Guayaquil': { price: 18, duration: '8 horas' },
    'Guayaquil-Quito': { price: 18, duration: '8 horas' },
    'Quito-Cuenca': { price: 16, duration: '9 horas' },
    'Cuenca-Quito': { price: 16, duration: '9 horas' },
    'Guayaquil-Cuenca': { price: 12, duration: '4 horas' },
    'Cuenca-Guayaquil': { price: 12, duration: '4 horas' },

    // Rutas medianas desde Quito
    'Quito-Ambato': { price: 5, duration: '2 horas' },
    'Ambato-Quito': { price: 5, duration: '2 horas' },
    'Quito-Ibarra': { price: 6, duration: '2.5 horas' },
    'Ibarra-Quito': { price: 6, duration: '2.5 horas' },
    'Quito-Latacunga': { price: 4, duration: '1.5 horas' },
    'Latacunga-Quito': { price: 4, duration: '1.5 horas' },
    'Quito-Riobamba': { price: 7, duration: '3 horas' },
    'Riobamba-Quito': { price: 7, duration: '3 horas' },
    'Quito-Santo Domingo': { price: 8, duration: '3.5 horas' },
    'Santo Domingo-Quito': { price: 8, duration: '3.5 horas' },
    'Quito-Guaranda': { price: 6, duration: '2.5 horas' },
    'Guaranda-Quito': { price: 6, duration: '2.5 horas' },
    'Quito-Tulcán': { price: 9, duration: '4 horas' },
    'Tulcán-Quito': { price: 9, duration: '4 horas' },
    'Quito-Esmeraldas': { price: 10, duration: '5 horas' },
    'Esmeraldas-Quito': { price: 10, duration: '5 horas' },
    'Quito-Tena': { price: 8, duration: '4 horas' },
    'Tena-Quito': { price: 8, duration: '4 horas' },
    'Quito-Puyo': { price: 9, duration: '4.5 horas' },
    'Puyo-Quito': { price: 9, duration: '4.5 horas' },

    // Rutas desde Guayaquil
    'Guayaquil-Machala': { price: 7, duration: '2 horas' },
    'Machala-Guayaquil': { price: 7, duration: '2 horas' },
    'Guayaquil-Manta': { price: 10, duration: '3 horas' },
    'Manta-Guayaquil': { price: 10, duration: '3 horas' },
    'Guayaquil-Babahoyo': { price: 4, duration: '1 hora' },
    'Babahoyo-Guayaquil': { price: 4, duration: '1 hora' },
    'Guayaquil-Portoviejo': { price: 9, duration: '3 horas' },
    'Portoviejo-Guayaquil': { price: 9, duration: '3 horas' },
    'Guayaquil-Salinas': { price: 6, duration: '2 horas' },
    'Salinas-Guayaquil': { price: 6, duration: '2 horas' },
    'Guayaquil-Santa Elena': { price: 5, duration: '1.5 horas' },
    'Santa Elena-Guayaquil': { price: 5, duration: '1.5 horas' },
    'Guayaquil-Santo Domingo': { price: 11, duration: '4 horas' },
    'Santo Domingo-Guayaquil': { price: 11, duration: '4 horas' },

    // Rutas desde Cuenca
    'Cuenca-Loja': { price: 8, duration: '3 horas' },
    'Loja-Cuenca': { price: 8, duration: '3 horas' },
    'Cuenca-Cañar': { price: 4, duration: '1 hora' },
    'Cañar-Cuenca': { price: 4, duration: '1 hora' },
    'Cuenca-Azogues': { price: 3, duration: '30 minutos' },
    'Azogues-Cuenca': { price: 3, duration: '30 minutos' },
    'Cuenca-Riobamba': { price: 12, duration: '5 horas' },
    'Riobamba-Cuenca': { price: 12, duration: '5 horas' },
    'Cuenca-Macas': { price: 10, duration: '4 horas' },
    'Macas-Cuenca': { price: 10, duration: '4 horas' },

    // Rutas desde Ambato
    'Ambato-Riobamba': { price: 4, duration: '1 hora' },
    'Riobamba-Ambato': { price: 4, duration: '1 hora' },
    'Ambato-Guaranda': { price: 5, duration: '1.5 horas' },
    'Guaranda-Ambato': { price: 5, duration: '1.5 horas' },
    'Ambato-Latacunga': { price: 3, duration: '45 minutos' },
    'Latacunga-Ambato': { price: 3, duration: '45 minutos' },
    'Ambato-Baños': { price: 4, duration: '1 hora' },
    'Baños-Ambato': { price: 4, duration: '1 hora' },
    'Ambato-Puyo': { price: 7, duration: '3 horas' },
    'Puyo-Ambato': { price: 7, duration: '3 horas' },

    // Rutas desde Ibarra
    'Ibarra-Tulcán': { price: 5, duration: '2 horas' },
    'Tulcán-Ibarra': { price: 5, duration: '2 horas' },
    'Ibarra-Esmeraldas': { price: 8, duration: '3.5 horas' },
    'Esmeraldas-Ibarra': { price: 8, duration: '3.5 horas' },
    'Ibarra-Otavalo': { price: 3, duration: '30 minutos' },
    'Otavalo-Ibarra': { price: 3, duration: '30 minutos' },
    'Ibarra-Latacunga': { price: 7, duration: '3 horas' },
    'Latacunga-Ibarra': { price: 7, duration: '3 horas' },

    // Rutas desde Loja
    'Loja-Zamora': { price: 5, duration: '1.5 horas' },
    'Zamora-Loja': { price: 5, duration: '1.5 horas' },
    'Loja-Macará': { price: 6, duration: '2 horas' },
    'Macará-Loja': { price: 6, duration: '2 horas' },
    'Loja-Catamayo': { price: 3, duration: '30 minutos' },
    'Catamayo-Loja': { price: 3, duration: '30 minutos' },
    'Loja-Machala': { price: 9, duration: '3.5 horas' },
    'Machala-Loja': { price: 9, duration: '3.5 horas' },

    // Rutas desde Manta
    'Manta-Portoviejo': { price: 3, duration: '45 minutos' },
    'Portoviejo-Manta': { price: 3, duration: '45 minutos' },
    'Manta-Montecristi': { price: 4, duration: '1 hora' },
    'Montecristi-Manta': { price: 4, duration: '1 hora' },
    'Manta-Puerto López': { price: 5, duration: '1.5 horas' },
    'Puerto López-Manta': { price: 5, duration: '1.5 horas' },
    'Manta-Bahía de Caráquez': { price: 6, duration: '2 horas' },
    'Bahía de Caráquez-Manta': { price: 6, duration: '2 horas' },
    'Manta-Santo Domingo': { price: 9, duration: '3.5 horas' },
    'Santo Domingo-Manta': { price: 9, duration: '3.5 horas' },
    'Manta-Salinas': { price: 8, duration: '3 horas' },
    'Salinas-Manta': { price: 8, duration: '3 horas' },

    // Rutas desde Riobamba
    'Riobamba-Guaranda': { price: 5, duration: '1.5 horas' },
    'Guaranda-Riobamba': { price: 5, duration: '1.5 horas' },
    'Riobamba-Latacunga': { price: 4, duration: '1 hora' },
    'Latacunga-Riobamba': { price: 4, duration: '1 hora' },
    'Riobamba-Baños': { price: 4, duration: '1 hora' },
    'Baños-Riobamba': { price: 4, duration: '1 hora' },

    // Rutas desde Esmeraldas
    'Esmeraldas-Atacames': { price: 3, duration: '30 minutos' },
    'Atacames-Esmeraldas': { price: 3, duration: '30 minutos' },
    'Esmeraldas-San Lorenzo': { price: 6, duration: '2 horas' },
    'San Lorenzo-Esmeraldas': { price: 6, duration: '2 horas' },
    'Esmeraldas-Santo Domingo': { price: 7, duration: '3 horas' },
    'Santo Domingo-Esmeraldas': { price: 7, duration: '3 horas' },

    // Rutas desde Machala
    'Machala-Santa Rosa': { price: 4, duration: '1 hora' },
    'Santa Rosa-Machala': { price: 4, duration: '1 hora' },
    'Machala-Pasaje': { price: 3, duration: '45 minutos' },
    'Pasaje-Machala': { price: 3, duration: '45 minutos' },
    'Machala-Zaruma': { price: 3, duration: '2 horas' },
    'Zaruma-Machala': { price: 3, duration: '2 horas' },
    'Machala-Piñas': { price: 3, duration: '1.5 horas' },
    'Piñas-Machala': { price: 3, duration: '1.5 horas' },
    'Machala-Huaquillas': { price: 4, duration: '1.5 horas' },
    'Huaquillas-Machala': { price: 4, duration: '1.5 horas' },

    // Rutas desde Puyo
    'Puyo-Tena': { price: 5, duration: '2 horas' },
    'Tena-Puyo': { price: 5, duration: '2 horas' },
    'Puyo-Baños': { price: 6, duration: '2.5 horas' },
    'Baños-Puyo': { price: 6, duration: '2.5 horas' },
    'Puyo-Macas': { price: 6, duration: '2.5 horas' },
    'Macas-Puyo': { price: 6, duration: '2.5 horas' },
    'Puyo-Lago Agrio': { price: 8, duration: '3.5 horas' },
    'Lago Agrio-Puyo': { price: 8, duration: '3.5 horas' },

    // Rutas desde Tena
    'Tena-Francisco de Orellana': { price: 5, duration: '2 horas' },
    'Francisco de Orellana-Tena': { price: 5, duration: '2 horas' },
    'Tena-Archidona': { price: 3, duration: '45 minutos' },
    'Archidona-Tena': { price: 3, duration: '45 minutos' },
    'Tena-Macas': { price: 7, duration: '3 horas' },
    'Macas-Tena': { price: 7, duration: '3 horas' },
    'Tena-Lago Agrio': { price: 9, duration: '4 horas' },
    'Lago Agrio-Tena': { price: 9, duration: '4 horas' },

    // Rutas desde Francisco de Orellana
    'Francisco de Orellana-Lago Agrio': { price: 7, duration: '3 horas' },
    'Lago Agrio-Francisco de Orellana': { price: 7, duration: '3 horas' },

    // Rutas desde Santo Domingo
    'Santo Domingo-Quevedo': { price: 5, duration: '2 horas' },
    'Quevedo-Santo Domingo': { price: 5, duration: '2 horas' },

    // Rutas desde Salinas
    'Salinas-Santa Elena': { price: 3, duration: '30 minutos' },
    'Santa Elena-Salinas': { price: 3, duration: '30 minutos' },
    'Salinas-Montañita': { price: 4, duration: '1 hora' },
    'Montañita-Salinas': { price: 4, duration: '1 hora' },

    // Rutas desde Babahoyo
    'Babahoyo-Quevedo': { price: 4, duration: '1 hora' },
    'Quevedo-Babahoyo': { price: 4, duration: '1 hora' },
    'Babahoyo-Ventanas': { price: 3, duration: '45 minutos' },
    'Ventanas-Babahoyo': { price: 3, duration: '45 minutos' },
    'Babahoyo-Vinces': { price: 3, duration: '1 hora' },
    'Vinces-Babahoyo': { price: 3, duration: '1 hora' },

    // Rutas desde Tulcán
    'Tulcán-San Gabriel': { price: 4, duration: '1 hora' },
    'San Gabriel-Tulcán': { price: 4, duration: '1 hora' },

    // Rutas desde Zamora
    'Zamora-Yantzaza': { price: 5, duration: '1.5 horas' },
    'Yantzaza-Zamora': { price: 5, duration: '1.5 horas' },
    'Zamora-Gualaquiza': { price: 6, duration: '2 horas' },
    'Gualaquiza-Zamora': { price: 6, duration: '2 horas' },

    // Rutas adicionales solicitadas
    'Guayaquil-Huaquillas': { price: 8, duration: '4.5 horas' },
    'Huaquillas-Guayaquil': { price: 8, duration: '4.5 horas' },
    'Quito-Huaquillas': { price: 18, duration: '9.5 horas' },
    'Huaquillas-Quito': { price: 18, duration: '9.5 horas' },
    'Macas-Limon Indanza': { price: 5, duration: '2.5 horas' },
    'Limon Indanza-Macas': { price: 5, duration: '2.5 horas' }
  };

  const key = `${from}-${to}`;
  const ruta = rutas[key];

  if (ruta) {
    return ruta;
  }

  // Valores por defecto si no se encuentra la ruta
  return { price: 10, duration: '4 horas' };
}

// Datos de rutas entre ciudades
const rutas = [
  // Rutas principales - Quito y Guayaquil
  { name: 'Guayaquil - Quito', from: 'Guayaquil', to: 'Quito', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Quito') },
  { name: 'Quito - Guayaquil', from: 'Quito', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Quito', 'Guayaquil') },

  // Rutas desde Macas
  { name: 'Macas - Cuenca', from: 'Macas', to: 'Cuenca', seats: 35, ...getPrecioYDuracion('Macas', 'Cuenca') },
  { name: 'Cuenca - Macas', from: 'Cuenca', to: 'Macas', seats: 35, ...getPrecioYDuracion('Cuenca', 'Macas') },
  { name: 'Macas - Puyo', from: 'Macas', to: 'Puyo', seats: 30, ...getPrecioYDuracion('Macas', 'Puyo') },
  { name: 'Puyo - Macas', from: 'Puyo', to: 'Macas', seats: 30, ...getPrecioYDuracion('Puyo', 'Macas') },
  { name: 'Macas - Tena', from: 'Macas', to: 'Tena', seats: 30, ...getPrecioYDuracion('Macas', 'Tena') },
  { name: 'Tena - Macas', from: 'Tena', to: 'Macas', seats: 30, ...getPrecioYDuracion('Tena', 'Macas') },

  // Rutas desde Lago Agrio
  { name: 'Lago Agrio - Puyo', from: 'Lago Agrio', to: 'Puyo', seats: 30, ...getPrecioYDuracion('Lago Agrio', 'Puyo') },
  { name: 'Puyo - Lago Agrio', from: 'Puyo', to: 'Lago Agrio', seats: 30, ...getPrecioYDuracion('Puyo', 'Lago Agrio') },
  { name: 'Lago Agrio - Tena', from: 'Lago Agrio', to: 'Tena', seats: 30, ...getPrecioYDuracion('Lago Agrio', 'Tena') },
  { name: 'Tena - Lago Agrio', from: 'Tena', to: 'Lago Agrio', seats: 30, ...getPrecioYDuracion('Tena', 'Lago Agrio') },
  { name: 'Lago Agrio - Francisco de Orellana', from: 'Lago Agrio', to: 'Francisco de Orellana', seats: 30, ...getPrecioYDuracion('Lago Agrio', 'Francisco de Orellana') },
  { name: 'Francisco de Orellana - Lago Agrio', from: 'Francisco de Orellana', to: 'Lago Agrio', seats: 30, ...getPrecioYDuracion('Francisco de Orellana', 'Lago Agrio') },

  // Rutas desde Quito a otras ciudades
  { name: 'Quito - Cuenca', from: 'Quito', to: 'Cuenca', seats: 40, ...getPrecioYDuracion('Quito', 'Cuenca') },
  { name: 'Cuenca - Quito', from: 'Cuenca', to: 'Quito', seats: 40, ...getPrecioYDuracion('Cuenca', 'Quito') },
  { name: 'Quito - Ambato', from: 'Quito', to: 'Ambato', seats: 40, ...getPrecioYDuracion('Quito', 'Ambato') },
  { name: 'Ambato - Quito', from: 'Ambato', to: 'Quito', seats: 40, ...getPrecioYDuracion('Ambato', 'Quito') },
  { name: 'Quito - Ibarra', from: 'Quito', to: 'Ibarra', seats: 40, ...getPrecioYDuracion('Quito', 'Ibarra') },
  { name: 'Ibarra - Quito', from: 'Ibarra', to: 'Quito', seats: 40, ...getPrecioYDuracion('Ibarra', 'Quito') },
  { name: 'Quito - Latacunga', from: 'Quito', to: 'Latacunga', seats: 40, ...getPrecioYDuracion('Quito', 'Latacunga') },
  { name: 'Latacunga - Quito', from: 'Latacunga', to: 'Quito', seats: 40, ...getPrecioYDuracion('Latacunga', 'Quito') },
  { name: 'Quito - Riobamba', from: 'Quito', to: 'Riobamba', seats: 40, ...getPrecioYDuracion('Quito', 'Riobamba') },
  { name: 'Riobamba - Quito', from: 'Riobamba', to: 'Quito', seats: 40, ...getPrecioYDuracion('Riobamba', 'Quito') },
  { name: 'Quito - Tena', from: 'Quito', to: 'Tena', seats: 35, ...getPrecioYDuracion('Quito', 'Tena') },
  { name: 'Tena - Quito', from: 'Tena', to: 'Quito', seats: 35, ...getPrecioYDuracion('Tena', 'Quito') },
  { name: 'Quito - Puyo', from: 'Quito', to: 'Puyo', seats: 35, ...getPrecioYDuracion('Quito', 'Puyo') },
  { name: 'Puyo - Quito', from: 'Puyo', to: 'Quito', seats: 35, ...getPrecioYDuracion('Puyo', 'Quito') },
  { name: 'Quito - Santo Domingo', from: 'Quito', to: 'Santo Domingo', seats: 40, ...getPrecioYDuracion('Quito', 'Santo Domingo') },
  { name: 'Santo Domingo - Quito', from: 'Santo Domingo', to: 'Quito', seats: 40, ...getPrecioYDuracion('Santo Domingo', 'Quito') },
  { name: 'Quito - Guaranda', from: 'Quito', to: 'Guaranda', seats: 40, ...getPrecioYDuracion('Quito', 'Guaranda') },
  { name: 'Guaranda - Quito', from: 'Guaranda', to: 'Quito', seats: 40, ...getPrecioYDuracion('Guaranda', 'Quito') },
  { name: 'Quito - Tulcán', from: 'Quito', to: 'Tulcán', seats: 40, ...getPrecioYDuracion('Quito', 'Tulcán') },
  { name: 'Tulcán - Quito', from: 'Tulcán', to: 'Quito', seats: 40, ...getPrecioYDuracion('Tulcán', 'Quito') },
  { name: 'Quito - Esmeraldas', from: 'Quito', to: 'Esmeraldas', seats: 35, ...getPrecioYDuracion('Quito', 'Esmeraldas') },
  { name: 'Esmeraldas - Quito', from: 'Esmeraldas', to: 'Quito', seats: 35, ...getPrecioYDuracion('Esmeraldas', 'Quito') },

  // Rutas desde Guayaquil
  { name: 'Guayaquil - Cuenca', from: 'Guayaquil', to: 'Cuenca', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Cuenca') },
  { name: 'Cuenca - Guayaquil', from: 'Cuenca', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Cuenca', 'Guayaquil') },
  { name: 'Guayaquil - Machala', from: 'Guayaquil', to: 'Machala', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Machala') },
  { name: 'Machala - Guayaquil', from: 'Machala', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Machala', 'Guayaquil') },
  { name: 'Guayaquil - Manta', from: 'Guayaquil', to: 'Manta', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Manta') },
  { name: 'Manta - Guayaquil', from: 'Manta', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Manta', 'Guayaquil') },
  { name: 'Guayaquil - Babahoyo', from: 'Guayaquil', to: 'Babahoyo', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Babahoyo') },
  { name: 'Babahoyo - Guayaquil', from: 'Babahoyo', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Babahoyo', 'Guayaquil') },
  { name: 'Guayaquil - Portoviejo', from: 'Guayaquil', to: 'Portoviejo', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Portoviejo') },
  { name: 'Portoviejo - Guayaquil', from: 'Portoviejo', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Portoviejo', 'Guayaquil') },
  { name: 'Guayaquil - Salinas', from: 'Guayaquil', to: 'Salinas', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Salinas') },
  { name: 'Salinas - Guayaquil', from: 'Salinas', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Salinas', 'Guayaquil') },
  { name: 'Guayaquil - Santa Elena', from: 'Guayaquil', to: 'Santa Elena', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Santa Elena') },
  { name: 'Santa Elena - Guayaquil', from: 'Santa Elena', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Santa Elena', 'Guayaquil') },
  { name: 'Guayaquil - Santo Domingo', from: 'Guayaquil', to: 'Santo Domingo', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Santo Domingo') },
  { name: 'Santo Domingo - Guayaquil', from: 'Santo Domingo', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Santo Domingo', 'Guayaquil') },

  // Rutas desde Cuenca
  { name: 'Cuenca - Loja', from: 'Cuenca', to: 'Loja', seats: 40, ...getPrecioYDuracion('Cuenca', 'Loja') },
  { name: 'Loja - Cuenca', from: 'Loja', to: 'Cuenca', seats: 40, ...getPrecioYDuracion('Loja', 'Cuenca') },
  { name: 'Cuenca - Cañar', from: 'Cuenca', to: 'Cañar', seats: 35, ...getPrecioYDuracion('Cuenca', 'Cañar') },
  { name: 'Cañar - Cuenca', from: 'Cañar', to: 'Cuenca', seats: 35, ...getPrecioYDuracion('Cañar', 'Cuenca') },
  { name: 'Cuenca - Azogues', from: 'Cuenca', to: 'Azogues', seats: 35, ...getPrecioYDuracion('Cuenca', 'Azogues') },
  { name: 'Azogues - Cuenca', from: 'Azogues', to: 'Cuenca', seats: 35, ...getPrecioYDuracion('Azogues', 'Cuenca') },
  { name: 'Cuenca - Riobamba', from: 'Cuenca', to: 'Riobamba', seats: 40, ...getPrecioYDuracion('Cuenca', 'Riobamba') },
  { name: 'Riobamba - Cuenca', from: 'Riobamba', to: 'Cuenca', seats: 40, ...getPrecioYDuracion('Riobamba', 'Cuenca') },

  // Rutas desde Ambato
  { name: 'Ambato - Riobamba', from: 'Ambato', to: 'Riobamba', seats: 40, ...getPrecioYDuracion('Ambato', 'Riobamba') },
  { name: 'Riobamba - Ambato', from: 'Riobamba', to: 'Ambato', seats: 40, ...getPrecioYDuracion('Riobamba', 'Ambato') },
  { name: 'Ambato - Guaranda', from: 'Ambato', to: 'Guaranda', seats: 35, ...getPrecioYDuracion('Ambato', 'Guaranda') },
  { name: 'Guaranda - Ambato', from: 'Guaranda', to: 'Ambato', seats: 35, ...getPrecioYDuracion('Guaranda', 'Ambato') },
  { name: 'Ambato - Latacunga', from: 'Ambato', to: 'Latacunga', seats: 40, ...getPrecioYDuracion('Ambato', 'Latacunga') },
  { name: 'Latacunga - Ambato', from: 'Latacunga', to: 'Ambato', seats: 40, ...getPrecioYDuracion('Latacunga', 'Ambato') },
  { name: 'Ambato - Baños', from: 'Ambato', to: 'Baños', seats: 35, ...getPrecioYDuracion('Ambato', 'Baños') },
  { name: 'Baños - Ambato', from: 'Baños', to: 'Ambato', seats: 35, ...getPrecioYDuracion('Baños', 'Ambato') },

  // Rutas desde Ibarra
  { name: 'Ibarra - Tulcán', from: 'Ibarra', to: 'Tulcán', seats: 40, ...getPrecioYDuracion('Ibarra', 'Tulcán') },
  { name: 'Tulcán - Ibarra', from: 'Tulcán', to: 'Ibarra', seats: 40, ...getPrecioYDuracion('Tulcán', 'Ibarra') },
  { name: 'Ibarra - Esmeraldas', from: 'Ibarra', to: 'Esmeraldas', seats: 35, ...getPrecioYDuracion('Ibarra', 'Esmeraldas') },
  { name: 'Esmeraldas - Ibarra', from: 'Esmeraldas', to: 'Ibarra', seats: 35, ...getPrecioYDuracion('Esmeraldas', 'Ibarra') },
  { name: 'Ibarra - Otavalo', from: 'Ibarra', to: 'Otavalo', seats: 35, ...getPrecioYDuracion('Ibarra', 'Otavalo') },
  { name: 'Otavalo - Ibarra', from: 'Otavalo', to: 'Ibarra', seats: 35, ...getPrecioYDuracion('Otavalo', 'Ibarra') },
  { name: 'Ibarra - Latacunga', from: 'Ibarra', to: 'Latacunga', seats: 40, ...getPrecioYDuracion('Ibarra', 'Latacunga') },
  { name: 'Latacunga - Ibarra', from: 'Latacunga', to: 'Ibarra', seats: 40, ...getPrecioYDuracion('Latacunga', 'Ibarra') },

  // Rutas desde Loja
  { name: 'Loja - Zamora', from: 'Loja', to: 'Zamora', seats: 35, ...getPrecioYDuracion('Loja', 'Zamora') },
  { name: 'Zamora - Loja', from: 'Zamora', to: 'Loja', seats: 35, ...getPrecioYDuracion('Zamora', 'Loja') },
  { name: 'Loja - Macará', from: 'Loja', to: 'Macará', seats: 35, ...getPrecioYDuracion('Loja', 'Macará') },
  { name: 'Macará - Loja', from: 'Macará', to: 'Loja', seats: 35, ...getPrecioYDuracion('Macará', 'Loja') },
  { name: 'Loja - Catamayo', from: 'Loja', to: 'Catamayo', seats: 35, ...getPrecioYDuracion('Loja', 'Catamayo') },
  { name: 'Catamayo - Loja', from: 'Catamayo', to: 'Loja', seats: 35, ...getPrecioYDuracion('Catamayo', 'Loja') },

  // Rutas desde Manta
  { name: 'Manta - Portoviejo', from: 'Manta', to: 'Portoviejo', seats: 40, ...getPrecioYDuracion('Manta', 'Portoviejo') },
  { name: 'Portoviejo - Manta', from: 'Portoviejo', to: 'Manta', seats: 40, ...getPrecioYDuracion('Portoviejo', 'Manta') },
  { name: 'Manta - Montecristi', from: 'Manta', to: 'Montecristi', seats: 35, ...getPrecioYDuracion('Manta', 'Montecristi') },
  { name: 'Montecristi - Manta', from: 'Montecristi', to: 'Manta', seats: 35, ...getPrecioYDuracion('Montecristi', 'Manta') },
  { name: 'Manta - Puerto López', from: 'Manta', to: 'Puerto López', seats: 35, ...getPrecioYDuracion('Manta', 'Puerto López') },
  { name: 'Puerto López - Manta', from: 'Puerto López', to: 'Manta', seats: 35, ...getPrecioYDuracion('Puerto López', 'Manta') },
  { name: 'Manta - Bahía de Caráquez', from: 'Manta', to: 'Bahía de Caráquez', seats: 35, ...getPrecioYDuracion('Manta', 'Bahía de Caráquez') },
  { name: 'Bahía de Caráquez - Manta', from: 'Bahía de Caráquez', to: 'Manta', seats: 35, ...getPrecioYDuracion('Bahía de Caráquez', 'Manta') },

  // Rutas desde Riobamba
  { name: 'Riobamba - Guaranda', from: 'Riobamba', to: 'Guaranda', seats: 35, ...getPrecioYDuracion('Riobamba', 'Guaranda') },
  { name: 'Guaranda - Riobamba', from: 'Guaranda', to: 'Riobamba', seats: 35, ...getPrecioYDuracion('Guaranda', 'Riobamba') },
  { name: 'Riobamba - Latacunga', from: 'Riobamba', to: 'Latacunga', seats: 40, ...getPrecioYDuracion('Riobamba', 'Latacunga') },
  { name: 'Latacunga - Riobamba', from: 'Latacunga', to: 'Riobamba', seats: 40, ...getPrecioYDuracion('Latacunga', 'Riobamba') },
  { name: 'Riobamba - Baños', from: 'Riobamba', to: 'Baños', seats: 35, ...getPrecioYDuracion('Riobamba', 'Baños') },
  { name: 'Baños - Riobamba', from: 'Baños', to: 'Riobamba', seats: 35, ...getPrecioYDuracion('Baños', 'Riobamba') },

  // Rutas desde Esmeraldas
  { name: 'Esmeraldas - Atacames', from: 'Esmeraldas', to: 'Atacames', seats: 35, ...getPrecioYDuracion('Esmeraldas', 'Atacames') },
  { name: 'Atacames - Esmeraldas', from: 'Atacames', to: 'Esmeraldas', seats: 35, ...getPrecioYDuracion('Atacames', 'Esmeraldas') },
  { name: 'Esmeraldas - San Lorenzo', from: 'Esmeraldas', to: 'San Lorenzo', seats: 30, ...getPrecioYDuracion('Esmeraldas', 'San Lorenzo') },
  { name: 'San Lorenzo - Esmeraldas', from: 'San Lorenzo', to: 'Esmeraldas', seats: 30, ...getPrecioYDuracion('San Lorenzo', 'Esmeraldas') },

  // Rutas desde Machala
  { name: 'Machala - Santa Rosa', from: 'Machala', to: 'Santa Rosa', seats: 35, ...getPrecioYDuracion('Machala', 'Santa Rosa') },
  { name: 'Santa Rosa - Machala', from: 'Santa Rosa', to: 'Machala', seats: 35, ...getPrecioYDuracion('Santa Rosa', 'Machala') },
  { name: 'Machala - Pasaje', from: 'Machala', to: 'Pasaje', seats: 35, ...getPrecioYDuracion('Machala', 'Pasaje') },
  { name: 'Pasaje - Machala', from: 'Pasaje', to: 'Machala', seats: 35, ...getPrecioYDuracion('Pasaje', 'Machala') },
  { name: 'Machala - Loja', from: 'Machala', to: 'Loja', seats: 40, ...getPrecioYDuracion('Machala', 'Loja') },
  { name: 'Loja - Machala', from: 'Loja', to: 'Machala', seats: 40, ...getPrecioYDuracion('Loja', 'Machala') },
  { name: 'Machala - Zaruma', from: 'Machala', to: 'Zaruma', seats: 35, ...getPrecioYDuracion('Machala', 'Zaruma') },
  { name: 'Zaruma - Machala', from: 'Zaruma', to: 'Machala', seats: 35, ...getPrecioYDuracion('Zaruma', 'Machala') },
  { name: 'Machala - Piñas', from: 'Machala', to: 'Piñas', seats: 35, ...getPrecioYDuracion('Machala', 'Piñas') },
  { name: 'Piñas - Machala', from: 'Piñas', to: 'Machala', seats: 35, ...getPrecioYDuracion('Piñas', 'Machala') },
  { name: 'Guayaquil - Huaquillas', from: 'Guayaquil', to: 'Huaquillas', seats: 40, ...getPrecioYDuracion('Guayaquil', 'Huaquillas') },
  { name: 'Huaquillas - Guayaquil', from: 'Huaquillas', to: 'Guayaquil', seats: 40, ...getPrecioYDuracion('Huaquillas', 'Guayaquil') },
  { name: 'Quito - Huaquillas', from: 'Quito', to: 'Huaquillas', seats: 40, ...getPrecioYDuracion('Quito', 'Huaquillas') },
  { name: 'Huaquillas - Quito', from: 'Huaquillas', to: 'Quito', seats: 40, ...getPrecioYDuracion('Huaquillas', 'Quito') },
  { name: 'Machala - Huaquillas', from: 'Machala', to: 'Huaquillas', seats: 35, ...getPrecioYDuracion('Machala', 'Huaquillas') },
  { name: 'Huaquillas - Machala', from: 'Huaquillas', to: 'Machala', seats: 35, ...getPrecioYDuracion('Huaquillas', 'Machala') },

  // Rutas desde Puyo
  { name: 'Puyo - Tena', from: 'Puyo', to: 'Tena', seats: 30, ...getPrecioYDuracion('Puyo', 'Tena') },
  { name: 'Tena - Puyo', from: 'Tena', to: 'Puyo', seats: 30, ...getPrecioYDuracion('Tena', 'Puyo') },
  { name: 'Puyo - Baños', from: 'Puyo', to: 'Baños', seats: 35, ...getPrecioYDuracion('Puyo', 'Baños') },
  { name: 'Baños - Puyo', from: 'Baños', to: 'Puyo', seats: 35, ...getPrecioYDuracion('Baños', 'Puyo') },
  { name: 'Puyo - Ambato', from: 'Puyo', to: 'Ambato', seats: 35, ...getPrecioYDuracion('Puyo', 'Ambato') },
  { name: 'Ambato - Puyo', from: 'Ambato', to: 'Puyo', seats: 35, ...getPrecioYDuracion('Ambato', 'Puyo') },

  // Rutas desde Tena
  { name: 'Tena - Francisco de Orellana', from: 'Tena', to: 'Francisco de Orellana', seats: 30, ...getPrecioYDuracion('Tena', 'Francisco de Orellana') },
  { name: 'Francisco de Orellana - Tena', from: 'Francisco de Orellana', to: 'Tena', seats: 30, ...getPrecioYDuracion('Francisco de Orellana', 'Tena') },
  { name: 'Tena - Archidona', from: 'Tena', to: 'Archidona', seats: 30, ...getPrecioYDuracion('Tena', 'Archidona') },
  { name: 'Archidona - Tena', from: 'Archidona', to: 'Tena', seats: 30, ...getPrecioYDuracion('Archidona', 'Tena') },

  // Rutas desde Francisco de Orellana
  { name: 'Francisco de Orellana - Lago Agrio', from: 'Francisco de Orellana', to: 'Lago Agrio', seats: 30, ...getPrecioYDuracion('Francisco de Orellana', 'Lago Agrio') },
  { name: 'Lago Agrio - Francisco de Orellana', from: 'Lago Agrio', to: 'Francisco de Orellana', seats: 30, ...getPrecioYDuracion('Lago Agrio', 'Francisco de Orellana') },

  // Rutas desde Santo Domingo
  { name: 'Santo Domingo - Esmeraldas', from: 'Santo Domingo', to: 'Esmeraldas', seats: 35, ...getPrecioYDuracion('Santo Domingo', 'Esmeraldas') },
  { name: 'Esmeraldas - Santo Domingo', from: 'Esmeraldas', to: 'Santo Domingo', seats: 35, ...getPrecioYDuracion('Esmeraldas', 'Santo Domingo') },
  { name: 'Santo Domingo - Manta', from: 'Santo Domingo', to: 'Manta', seats: 40, ...getPrecioYDuracion('Santo Domingo', 'Manta') },
  { name: 'Manta - Santo Domingo', from: 'Manta', to: 'Santo Domingo', seats: 40, ...getPrecioYDuracion('Manta', 'Santo Domingo') },
  { name: 'Santo Domingo - Quevedo', from: 'Santo Domingo', to: 'Quevedo', seats: 40, ...getPrecioYDuracion('Santo Domingo', 'Quevedo') },
  { name: 'Quevedo - Santo Domingo', from: 'Quevedo', to: 'Santo Domingo', seats: 40, ...getPrecioYDuracion('Quevedo', 'Santo Domingo') },

  // Rutas desde Salinas
  { name: 'Salinas - Santa Elena', from: 'Salinas', to: 'Santa Elena', seats: 35, ...getPrecioYDuracion('Salinas', 'Santa Elena') },
  { name: 'Santa Elena - Salinas', from: 'Santa Elena', to: 'Salinas', seats: 35, ...getPrecioYDuracion('Santa Elena', 'Salinas') },
  { name: 'Salinas - Montañita', from: 'Salinas', to: 'Montañita', seats: 35, ...getPrecioYDuracion('Salinas', 'Montañita') },
  { name: 'Montañita - Salinas', from: 'Montañita', to: 'Salinas', seats: 35, ...getPrecioYDuracion('Montañita', 'Salinas') },
  { name: 'Salinas - Manta', from: 'Salinas', to: 'Manta', seats: 40, ...getPrecioYDuracion('Salinas', 'Manta') },
  { name: 'Manta - Salinas', from: 'Manta', to: 'Salinas', seats: 40, ...getPrecioYDuracion('Manta', 'Salinas') },

  // Rutas desde Babahoyo
  { name: 'Babahoyo - Quevedo', from: 'Babahoyo', to: 'Quevedo', seats: 40, ...getPrecioYDuracion('Babahoyo', 'Quevedo') },
  { name: 'Quevedo - Babahoyo', from: 'Quevedo', to: 'Babahoyo', seats: 40, ...getPrecioYDuracion('Quevedo', 'Babahoyo') },
  { name: 'Babahoyo - Ventanas', from: 'Babahoyo', to: 'Ventanas', seats: 35, ...getPrecioYDuracion('Babahoyo', 'Ventanas') },
  { name: 'Ventanas - Babahoyo', from: 'Ventanas', to: 'Babahoyo', seats: 35, ...getPrecioYDuracion('Ventanas', 'Babahoyo') },
  { name: 'Babahoyo - Vinces', from: 'Babahoyo', to: 'Vinces', seats: 35, ...getPrecioYDuracion('Babahoyo', 'Vinces') },
  { name: 'Vinces - Babahoyo', from: 'Vinces', to: 'Babahoyo', seats: 35, ...getPrecioYDuracion('Vinces', 'Babahoyo') },

  // Rutas desde Tulcán
  { name: 'Tulcán - San Gabriel', from: 'Tulcán', to: 'San Gabriel', seats: 35, ...getPrecioYDuracion('Tulcán', 'San Gabriel') },
  { name: 'San Gabriel - Tulcán', from: 'San Gabriel', to: 'Tulcán', seats: 35, ...getPrecioYDuracion('San Gabriel', 'Tulcán') },

  // Rutas desde Zamora
  { name: 'Zamora - Yantzaza', from: 'Zamora', to: 'Yantzaza', seats: 30, ...getPrecioYDuracion('Zamora', 'Yantzaza') },
  { name: 'Yantzaza - Zamora', from: 'Yantzaza', to: 'Zamora', seats: 30, ...getPrecioYDuracion('Yantzaza', 'Zamora') },
  { name: 'Zamora - Gualaquiza', from: 'Zamora', to: 'Gualaquiza', seats: 30, ...getPrecioYDuracion('Zamora', 'Gualaquiza') },
  { name: 'Gualaquiza - Zamora', from: 'Gualaquiza', to: 'Zamora', seats: 30, ...getPrecioYDuracion('Gualaquiza', 'Zamora') },

  // Rutas nuevas solicitadas
  { name: 'Macas - Limon Indanza', from: 'Macas', to: 'Limon Indanza', seats: 30, ...getPrecioYDuracion('Macas', 'Limon Indanza') },
  { name: 'Limon Indanza - Macas', from: 'Limon Indanza', to: 'Macas', seats: 30, ...getPrecioYDuracion('Limon Indanza', 'Macas') }
];

module.exports = {
  lugaresTuristicos,
  rutas
};

