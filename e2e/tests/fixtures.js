export const traveler = { _id: 'user-e2e', cedula: '0999999999', nombre: 'Persona', apellido: 'Prueba', role: 'user' };
export const routes = [
  { _id: '507f1f77bcf86cd799439011', from: 'Quito', to: 'Guayaquil', price: 15, seats: 40, duration: '8 horas', horaSalida: '08:00', salidas: [] },
  { _id: '507f1f77bcf86cd799439012', from: 'Cuenca', to: 'Quito', price: 12, seats: 38, duration: '7 horas', horaSalida: '09:00', salidas: [] }
];
export const places = [
  { _id: '507f191e810c19729de860aa', nombre: 'Malecón 2000', ciudad: 'Guayaquil', tipo: 'Cultural', descripcion: 'Paseo del río', precioEntrada: 0 },
  { _id: '507f191e810c19729de860ab', nombre: 'Mitad del Mundo', ciudad: 'Quito', tipo: 'Cultural', descripcion: 'Monumento', precioEntrada: 5 }
];
export const suggestions = [{ _id: '507f191e810c19729de860aa', nombre: 'Malecón 2000', tipo: 'lugarTuristico', direccion: 'Guayaquil', score: 4.7, promedioGeneral: 4.5, totalCalificaciones: 12 }];
export function testToken(userId = traveler._id) {
  return [Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url'), Buffer.from(JSON.stringify({ id: userId, role:'user', exp:9999999999 })).toString('base64url'),'test'].join('.');
}
export async function session(page, userId = traveler._id) {
  await page.addInitScript(token => {
    localStorage.setItem('token',token);
    localStorage.setItem('role','user');
  }, testToken(userId));
}
export async function mockApi(page, {
  rejectLogin = false,
  rejectRoutes = false,
  routeFixtures = routes,
  recommendationFixtures = {},
  enablePaymentFlow = false
} = {}) {
  const calls = [];
  const calificaciones = [];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method();
    const rawBody = req.postData();
    const body = rawBody ? JSON.parse(rawBody) : undefined;
    calls.push({
      method,
      path,
      query: Object.fromEntries(url.searchParams.entries()),
      ...(body === undefined ? {} : { body })
    });
    const answer = (value, status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
    if (path === '/auth/google/config') return answer({ habilitado: false });
    if (path === '/auth/login' && method === 'POST') return rejectLogin ? answer({error:'Credenciales incorrectas'},400) : answer({token:testToken(),role:'user',emailVerificado:true});
    if (path === '/auth/register' && method === 'POST') return answer({message:'Usuario registrado'},201);
    if (path === '/users/me') return answer(traveler);
    if (path === '/rutas' && method === 'GET') {
      return rejectRoutes
        ? answer({error:'No se pudieron cargar las rutas'},503)
        : answer(routeFixtures);
    }
    if (path.startsWith('/rutas/') && method === 'GET') {
      const rutaId = path.slice('/rutas/'.length);
      const ruta = routeFixtures.find(item => String(item._id || item.id) === rutaId);
      return ruta ? answer(ruta) : answer({error:'Ruta no encontrada'},404);
    }
    if (path === '/lugares-turisticos') return answer(places.filter(p => !url.searchParams.get('ciudad') || p.ciudad.toLowerCase() === url.searchParams.get('ciudad').toLowerCase()));
    if (path === '/hoteles') return answer([]);
    if (path === '/calificaciones' && method === 'GET') {
      const resultado = calificaciones.filter((calificacion) =>
        (!url.searchParams.get('tipo') || calificacion.tipo === url.searchParams.get('tipo'))
        && (!url.searchParams.get('referencia') || calificacion.referencia === url.searchParams.get('referencia'))
      );
      return answer(resultado);
    }
    if (path === '/calificaciones' && method === 'POST') {
      const calificacion = {
        ...body,
        _id: `rating-e2e-${calificaciones.length + 1}`,
        usuario: traveler._id,
        fecha: new Date().toISOString()
      };
      calificaciones.push(calificacion);
      return answer(calificacion,201);
    }
    if (path === '/recomendaciones') {
      return answer(recommendationFixtures[url.searchParams.get('usuarioId')] || suggestions);
    }
    if (path === '/reservas/mine') return answer({data:[],pagination:{totalPages:1}});
    if (path === '/asientos/disponibles') return answer({ok:true,total:40,available:[1,2,3,4]});
    if (path === '/asientos/holds') return answer({ok:true,holds:[]});
    if (path === '/pricing/calcular-precio') return answer({ok:true,cantidad:1,precioUnitario:15,subtotal:15,porcentajeDescuento:0,montoDescuento:0,total:15});
    if (enablePaymentFlow && path === '/asientos/reservar' && method === 'POST') {
      return answer({
        ok:true,
        holds:[{
          holdId:'hold-e2e-1',
          asiento:body.asientos[0],
          rutaId:body.rutaId,
          fecha:body.fecha,
          expiresAt:new Date(Date.now() + 600000).toISOString(),
          remainingMs:600000
        }]
      });
    }
    if (enablePaymentFlow && path === '/pagos/crear-orden' && method === 'POST') {
      return answer({orderId:'ORDER-E2E',approvalUrl:'https://paypal.test/checkout?token=ORDER-E2E'});
    }
    if (enablePaymentFlow && path === '/pagos/capturar-orden' && method === 'POST') {
      return answer({asientos:[1],cobro:{valor:15},enRevision:false});
    }
    // No convertir silenciosamente endpoints no simulados en éxitos.
    return answer({error:'No existe fixture: '+method+' '+path},501);
  });
  return { calls };
}
