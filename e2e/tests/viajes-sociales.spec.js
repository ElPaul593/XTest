import { test, expect } from '@playwright/test';
import { mockApi, session, testToken } from './fixtures.js';

const userProfiles = {
  guayasParques: 'user-guayas-parques',
  pichinchaMuseos: 'user-pichincha-museos'
};

const recommendationsByProfile = {
  [userProfiles.guayasParques]: [
    {
      _id:'parque-guayaquil',
      nombre:'Parque recomendado para Guayas',
      tipo:'Parque',
      direccion:'Guayaquil',
      score:4.8,
      promedioGeneral:4.6,
      totalCalificaciones:4,
      calificacionesMesActual:2,
      promedioMismaNacionalidad:4.8
    },
    {
      _id:'museo-guayaquil',
      nombre:'Museo de Guayaquil',
      tipo:'Museo',
      direccion:'Guayaquil',
      score:4.1,
      promedioGeneral:4.1,
      totalCalificaciones:2,
      calificacionesMesActual:1,
      promedioMismaNacionalidad:4.1
    }
  ],
  [userProfiles.pichinchaMuseos]: [
    {
      _id:'museo-guayaquil',
      nombre:'Museo de Guayaquil',
      tipo:'Museo',
      direccion:'Guayaquil',
      score:4.9,
      promedioGeneral:4.8,
      totalCalificaciones:5,
      calificacionesMesActual:3,
      promedioMismaNacionalidad:4.9
    },
    {
      _id:'parque-guayaquil',
      nombre:'Parque recomendado para Guayas',
      tipo:'Parque',
      direccion:'Guayaquil',
      score:4.0,
      promedioGeneral:4.0,
      totalCalificaciones:2,
      calificacionesMesActual:0,
      promedioMismaNacionalidad:4.0
    }
  ]
};

test('XT-E2E-11 | el visitante completa el registro y envía sus preferencias', async ({page}) => {
  const api = await mockApi(page);

  await test.step('Abre el formulario de registro para usuarios extranjeros', async () => {
    await page.goto('/register');
    await page.getByRole('button',{name:'Extranjeros'}).click();
    await expect(page.getByLabel('Pasaporte')).toBeVisible();
  });

  await test.step('Completa los datos de cuenta y elige preferencias turísticas', async () => {
    await page.getByLabel('Pasaporte').fill('E2E-PA-104928');
    await page.getByLabel('País de Origen').selectOption('México');
    await page.getByLabel('Correo electrónico').fill('registro.e2e@example.com');
    await page.getByLabel('Nombre', { exact:true }).fill('Alex');
    await page.getByLabel('Apellido').fill('Prueba');
    await page.getByLabel('Teléfono').fill('5512345678');
    await page.locator('#password').fill('clave-e2e-segura');
    await page.getByLabel('Museo').check();
    await page.getByLabel('Parque').check();
    await expect(page.getByRole('button',{name:'Crear cuenta'})).toBeEnabled();
    await page.getByRole('button',{name:'Crear cuenta'}).click();
  });

  await test.step('Confirma el resultado y los datos enviados al servicio de registro', async () => {
    await expect(page.getByRole('status')).toContainText('Usuario registrado con éxito');
    const registro = api.calls.find(call => call.method === 'POST' && call.path === '/auth/register');
    expect(registro.body).toMatchObject({
      pasaporte:'E2E-PA-104928',
      email:'registro.e2e@example.com',
      paisOrigen:'México',
      preferencias:['Museo','Parque']
    });
  });
});

test('XT-E2E-12 | el pasajero califica un lugar y ve actualizarse su promedio', async ({page}) => {
  await session(page);
  const api = await mockApi(page);

  await test.step('Abre los lugares turísticos de Guayaquil', async () => {
    await page.goto('/destino?ciudad=Guayaquil');
    await page.getByRole('button',{name:/Lugares Turísticos/}).click();
    await expect(page.locator('.item-card').filter({hasText:'Malecón 2000'})).toBeVisible();
  });

  await test.step('Califica Malecón 2000 y escribe una recomendación', async () => {
    const lugar = page.locator('.item-card').filter({hasText:'Malecón 2000'});
    await lugar.getByRole('button',{name:'Calificar y Recomendar'}).click();
    const modal = page.getByRole('heading',{name:'Calificar: Malecón 2000'}).locator('..');
    await modal.getByLabel('Calificación (1-5 estrellas)').selectOption('4');
    await modal.getByLabel('Recomendación').fill('Recomendado para visitar en familia.');
    await modal.getByRole('button',{name:'Guardar'}).click();
  });

  await test.step('Comprueba el promedio actualizado y el envío de la calificación', async () => {
    const lugar = page.locator('.item-card').filter({hasText:'Malecón 2000'});
    await expect(lugar.locator('.rating-text')).toContainText('4.0(1 reseñas)');
    const calificacion = api.calls.find(call => call.method === 'POST' && call.path === '/calificaciones');
    expect(calificacion.body).toMatchObject({
      tipo:'lugarTuristico',
      referencia:'507f191e810c19729de860aa',
      calificacion:4,
      recomendacion:'Recomendado para visitar en familia.'
    });
  });
});

test('XT-E2E-13 | un perfil de Guayas ve primero lugares de tipo Parque', async ({page}) => {
  await session(page, userProfiles.guayasParques);
  const api = await mockApi(page, { recommendationFixtures:recommendationsByProfile });

  await test.step('Solicita recomendaciones personalizadas para Guayaquil', async () => {
    await page.goto('/recomendados?ciudad=Guayaquil');
    await expect(page.getByRole('heading',{name:'Recomendados para ti en Guayaquil'})).toBeVisible();
    await expect(page.locator('.recomendado-card h3').first()).toHaveText('Parque recomendado para Guayas');
    await expect(page.locator('.recomendado-card').first()).toContainText('Tu provincia:');
  });

  await test.step('Verifica el perfil enviado y la clasificación presentada', async () => {
    const solicitud = api.calls.findLast
      ? api.calls.findLast(call => call.path === '/recomendaciones' && call.query.usuarioId === userProfiles.guayasParques)
      : api.calls.filter(call => call.path === '/recomendaciones' && call.query.usuarioId === userProfiles.guayasParques).pop();
    expect(solicitud.query).toMatchObject({ ciudad:'Guayaquil', tipo:'lugarTuristico', usuarioId:userProfiles.guayasParques });
    await expect(page.locator('.recomendado-card').first()).toContainText('4.80');
  });
});

test('XT-E2E-14 | un perfil de Pichincha ve primero lugares de tipo Museo', async ({page}) => {
  await session(page, userProfiles.pichinchaMuseos);
  const api = await mockApi(page, { recommendationFixtures:recommendationsByProfile });

  await test.step('Abre recomendaciones con el perfil de otra provincia y preferencia', async () => {
    await page.goto('/recomendados?ciudad=Guayaquil');
    await expect(page.getByRole('heading',{name:'Recomendados para ti en Guayaquil'})).toBeVisible();
    await expect(page.locator('.recomendado-card h3').first()).toHaveText('Museo de Guayaquil');
  });

  await test.step('Comprueba que se solicitó y se mostró el resultado de ese perfil', async () => {
    const solicitud = api.calls.filter(call =>
      call.path === '/recomendaciones' && call.query.usuarioId === userProfiles.pichinchaMuseos
    ).pop();
    expect(solicitud.query).toMatchObject({ ciudad:'Guayaquil', tipo:'lugarTuristico', usuarioId:userProfiles.pichinchaMuseos });
    await expect(page.locator('.recomendado-card').first()).toContainText('Tu provincia:');
    await expect(page.locator('.recomendado-card').first()).toContainText('4.90');
  });
});

test('XT-E2E-15 | el pasajero selecciona asiento y completa el checkout de prueba', async ({page}) => {
  await session(page);
  const api = await mockApi(page, { enablePaymentFlow:true });
  await page.route('https://paypal.test/**', route => {
    const returnUrl = new URL('/seat-booking', new URL(page.url()).origin);
    returnUrl.searchParams.set('orden','ORDER-E2E');
    returnUrl.searchParams.set('estado','aprobada');
    return route.fulfill({
      status:200,
      contentType:'text/html',
      body:`<!doctype html><html><body>
        <main>
          <h1>Checkout de PayPal de prueba</h1>
          <p>Orden ORDER-E2E · total de prueba $15.00</p>
          <button id="aprobar-pago" onclick="window.location.href='${returnUrl.toString()}'">Aprobar pago de prueba</button>
        </main>
      </body></html>`
    });
  });

  await test.step('Busca un viaje, elige la ruta y selecciona un asiento disponible', async () => {
    await page.goto('/boletos');
    await page.getByRole('button',{name:'Búsqueda rápida'}).click();
    await page.locator('.ruta-fila').filter({hasText:'Quito → Guayaquil'}).getByRole('button',{name:'Elegir'}).click();
    await page.getByRole('button',{name:'Asiento 1, ventana, disponible'}).click();
    await expect(page.getByText('Total a pagar')).toBeVisible();
    await expect(page.getByRole('button',{name:/Pagar.*con PayPal/})).toBeEnabled();
  });

  await test.step('Inicia el checkout y aprueba el pago simulado', async () => {
    await page.getByRole('button',{name:/Pagar.*con PayPal/}).click();
    await expect(page.getByRole('heading',{name:'Checkout de PayPal de prueba'})).toBeVisible();
    await page.getByRole('button',{name:'Aprobar pago de prueba'}).click();
  });

  await test.step('Regresa a la aplicación y verifica la confirmación del pago', async () => {
    await expect(page).toHaveURL(/\/seat-booking\?orden=ORDER-E2E&estado=aprobada/);
    await expect(page.getByRole('heading',{name:'¡Pago confirmado!'})).toBeVisible();
    expect(api.calls.some(call => call.method === 'POST' && call.path === '/asientos/reservar')).toBe(true);
    expect(api.calls.some(call => call.method === 'POST' && call.path === '/pagos/crear-orden')).toBe(true);
    expect(api.calls.some(call => call.method === 'POST' && call.path === '/pagos/capturar-orden')).toBe(true);
  });
});
