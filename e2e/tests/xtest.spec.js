import { test, expect } from '@playwright/test';
import { mockApi, session, routes } from './fixtures.js';

// Esta suite comprueba la SPA real de XTest con APIs controladas.
// No demuestra persistencia MongoDB ni transacciones/holds reales.

test('XT-E2E-01 | portada pública abre el acceso actual', async ({page}) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Ya tengo cuenta'})).toBeVisible();
  await page.getByRole('link',{name:'Ya tengo cuenta'}).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading',{name:'Iniciar sesión'})).toBeVisible();
});

test('XT-E2E-02 | el guard de boletos exige autenticación', async ({page}) => {
  await mockApi(page);
  await page.goto('/boletos');
  await expect(page).toHaveURL(/\/login$/);
});

test('XT-E2E-03 | login inválido presenta error controlado', async ({page}) => {
  await mockApi(page,{rejectLogin:true});
  await page.goto('/login');
  await page.locator('#identificacion').fill('0999999999');
  await page.locator('#password').fill('clave-no-valida');
  await page.getByRole('button',{name:'Entrar'}).click();
  await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('XT-E2E-04 | viajes: búsqueda rápida filtra rutas por ciudad', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/boletos');
  await expect(page.getByRole('heading',{name:'Comprar boletos'})).toBeVisible();
  await page.getByRole('button',{name:'Búsqueda rápida'}).click();
  await expect(page.locator('.ruta-fila')).toHaveCount(2);
  await page.getByLabel('Desde').selectOption('Quito');
  await expect(page.locator('.ruta-fila')).toHaveCount(1);
  const ruta = page.locator('.ruta-fila').filter({hasText:'Quito → Guayaquil'});
  await expect(ruta).toContainText('$15');
  await expect(page.getByLabel('Hasta').locator('option')).toHaveCount(2);
  await page.getByLabel('Hasta').selectOption('Guayaquil');
  await expect(ruta).toHaveCount(1);
  await page.getByRole('button',{name:'Limpiar'}).click();
  await expect(page.locator('.ruta-fila')).toHaveCount(2);
});

test('XT-E2E-05 | detalle del viaje permite abrir selección de asientos', async ({page}) => {
  await session(page);
  const api = await mockApi(page);
  await page.goto('/boletos');
  await page.getByRole('button',{name:'Búsqueda rápida'}).click();
  const fila = page.locator('.ruta-fila').filter({hasText:'Quito → Guayaquil'});
  await expect(fila).toContainText('$15');
  await fila.getByRole('button',{name:'Elegir'}).click();
  await expect(page).toHaveURL(/\/seat-booking\?/);
  const bookingUrl = new URL(page.url());
  expect(bookingUrl.searchParams.get('ruta')).toBe('507f1f77bcf86cd799439011');
  expect(bookingUrl.searchParams.get('fecha')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(bookingUrl.searchParams.get('hora')).toBe('08:00');
  await expect(page.getByRole('heading',{name:/Reserva de Asientos/})).toBeVisible();
  await expect(page.getByRole('group',{name:'Mapa de asientos del bus'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Asiento 1, ventana, disponible'})).toBeVisible();
  await expect.poll(() => api.calls.filter(call => call.path === '/asientos/disponibles')).toHaveLength(1);
});

test('XT-E2E-06 | turismo: filtro por nombre y ciudad', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/lugares-turisticos');
  await expect(page.getByRole('heading',{name:'Lugares turísticos'})).toBeVisible();
  await expect(page.locator('.lugar-card')).toHaveCount(2);
  await page.getByRole('searchbox',{name:'Buscar un lugar o ciudad'}).fill('Guayaquil');
  await expect(page.locator('.lugar-card')).toHaveCount(1);
  await expect(page.locator('.lugar-card')).toContainText('Malecón 2000');
});

test('XT-E2E-07 | recomendaciones turísticas presentan la puntuación', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/recomendados?ciudad=Guayaquil');
  await expect(page.getByRole('heading',{name:'Recomendados para ti en Guayaquil'})).toBeVisible();
  await expect(page.locator('.recomendado-card')).toHaveCount(1);
  await expect(page.locator('.recomendado-card')).toContainText('Malecón 2000');
  await expect(page.locator('.recomendado-card')).toContainText('4.70');
});
