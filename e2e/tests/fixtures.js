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
function jwt() {
  return [Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url'), Buffer.from(JSON.stringify({ id: traveler._id, role:'user', exp:9999999999 })).toString('base64url'),'test'].join('.');
}
export async function session(page) {
  await page.addInitScript(token => {
    localStorage.setItem('token',token);
    localStorage.setItem('role','user');
  }, jwt());
}
export async function mockApi(page, { rejectLogin = false } = {}) {
  const calls = [];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method();
    calls.push({ method, path });
    const answer = (value, status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
    if (path === '/auth/google/config') return answer({ habilitado: false });
    if (path === '/auth/login' && method === 'POST') return rejectLogin ? answer({error:'Credenciales incorrectas'},400) : answer({token:jwt(),role:'user',emailVerificado:true});
    if (path === '/users/me') return answer(traveler);
    if (path === '/rutas') return answer(routes);
    if (path === '/lugares-turisticos') return answer(places.filter(p => !url.searchParams.get('ciudad') || p.ciudad.toLowerCase() === url.searchParams.get('ciudad').toLowerCase()));
    if (path === '/hoteles') return answer([]);
    if (path === '/calificaciones') return answer([]);
    if (path === '/recomendaciones') return answer(suggestions);
    if (path === '/reservas/mine') return answer({data:[],pagination:{totalPages:1}});
    if (path === '/asientos/disponibles') return answer({ok:true,total:40,available:[1,2,3,4]});
    if (path === '/asientos/holds') return answer({ok:true,holds:[]});
    if (path === '/pricing/calcular-precio') return answer({ok:true,cantidad:1,precioUnitario:15,subtotal:15,porcentajeDescuento:0,montoDescuento:0,total:15});
    // No convertir silenciosamente endpoints no simulados en éxitos.
    return answer({error:'No existe fixture: '+method+' '+path},501);
  });
  return { calls };
}
