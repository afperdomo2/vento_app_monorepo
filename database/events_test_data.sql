-- =============================================================================
-- Script de datos de prueba para eventos
-- Copiar y pegar en PostgreSQL (ej. pgAdmin, psql, DBeaver)
-- =============================================================================
-- Ejecutar: psql -U postgres -d nombre_base_datos -f events_test_data.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EVENTOS DE TECNOLOGÍA
-- -----------------------------------------------------------------------------

INSERT INTO events (id, name, description, event_date, venue, total_capacity, available_tickets, price, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Tech Summit 2026 - Innovation Day', 
     'Únete al evento de tecnología más grande del año. Tendremos charlas sobre inteligencia artificial, innovación digital y software moderno.',
     '2026-05-15 09:00:00', 'Centro de Convenciones Lima', 500, 423, 150.00, NOW(), NOW()),

    (gen_random_uuid(), 'Workshop de IA y Machine Learning', 
     'Aprende a implementar modelos de inteligencia artificial en tu empresa. Hands-on con Python y TensorFlow.',
     '2026-06-20 14:00:00', 'TecHub Coworking', 50, 12, 89.00, NOW(), NOW()),

    (gen_random_uuid(), 'Startup Tech Night', 
     'Networking tecnológico con emprendedores del ecosistema startup. Pitch de proyectos innovadores.',
     '2026-04-10 19:00:00', 'Casa de la Cultura', 200, 180, 25.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE MÚSICA
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Jazz en el Parque', 
     'Una noche mágica con los mejores exponentes del jazz nacional e internacional. Disfruta de música en vivo al aire libre.',
     '2026-04-25 20:00:00', 'Parque de la Reserva', 1000, 756, 45.00, NOW(), NOW()),

    (gen_random_uuid(), 'Rock Fest Lima', 
     'El festival de rock más esperado. Tres bandas reconocidas interpretando sus grandes éxitos.',
     '2026-07-18 21:00:00', 'Estadio Monumental', 5000, 2100, 120.00, NOW(), NOW()),

    (gen_random_uuid(), 'Concierto Acústico - La Vida es un Río', 
     'Un íntimo concerto con artistas locales. Músicafolk y bossa nova en un ambiente único.',
     '2026-05-08 19:30:00', 'Teatro Municipal', 300, 45, 60.00, NOW(), NOW()),

    (gen_random_uuid(), 'Festival de Música Electrónica BEAT', 
     'DJ-set con los mejores artistas de la escena electrónica. Iluminación LED y experiencia inmersiva.',
     '2026-08-15 22:00:00', 'Club Arena', 800, 0, 85.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE ARTE
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Exposición: Miradas del Perú', 
     '展示 - Una muestra pictórica de artistas contemporáneos peruanos. Pintura, escultura y arte digital.',
     '2026-04-01 10:00:00', 'Museo de Arte Contemporáneo', 200, 156, 30.00, NOW(), NOW()),

    (gen_random_uuid(), 'Galería Abierta - Arte en la Calle', 
     'Recorrido por galerías de arte en el centro histórico. Incluye visita a estudios de artistas emergentes.',
     '2026-05-03 11:00:00', 'Barrio de Barranco', 150, 98, 0.00, NOW(), NOW()),

    (gen_random_uuid(), 'Taller de Escultura para Principiantes', 
     'Aprende las técnicas básicas de escultura en arcilla. Materiales incluidos.',
     '2026-06-12 15:00:00', 'Centro Cultural de Miraflores', 25, 8, 55.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE DEPORTES
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Maratón Ciudad de Lima 2026', 
     'La carrera más importante del año. 42km por las principales avenidas de Lima. Categorías: profesional y amateur.',
     '2026-09-20 05:00:00', 'Plaza de Armas', 8000, 3200, 75.00, NOW(), NOW()),

    (gen_random_uuid(), 'Partido de Fútbol: Perú vs Brasil', 
     'Encuentro de fútbol por las clasificatorias mundialistas. No te pierdas este partido histórico.',
     '2026-06-11 20:00:00', 'Estadio Nacional', 40000, 0, 250.00, NOW(), NOW()),

    (gen_random_uuid(), 'Carrera Costera 10K', 
     'Competencia atlética por el malecón de Miraflores. Categorías: 5K, 10K y 21K.',
     '2026-07-05 07:00:00', 'Malecón de Miraflores', 3000, 1850, 50.00, NOW(), NOW()),

    (gen_random_uuid(), 'Torneo de Tenis Amateur', 
     'Copa de tenis open. Singles y dobles. Inscribete y demuestra tu nivel.',
     '2026-08-22 09:00:00', 'Club Tennis Lima', 64, 22, 120.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE GASTRONOMÍA
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Festival Gastronómico: Sabor Peruano', 
     'Degusta los mejores platos de la cocina peruana. Shows culinarios y catas de productos gourmet.',
     '2026-05-22 12:00:00', 'Jockey Plaza', 1500, 890, 80.00, NOW(), NOW()),

    (gen_random_uuid(), 'Cata de Vinos Argentinos y Chilenos', 
     'Aprende sobre enología con expertos. 6 vinos seleccionados con maridaje gourmet.',
     '2026-06-28 19:00:00', 'Restaurante龙虾', 40, 15, 180.00, NOW(), NOW()),

    (gen_random_uuid(), 'Taller de Cocina Italiana', 
     'Curso de pasta fresca y salsa boloñesa con chef italiano. Incluye certificado.',
     '2026-07-10 11:00:00', 'Escuela de Cocina San Isidro', 20, 3, 200.00, NOW(), NOW()),

    (gen_random_uuid(), 'Food Truck Festival', 
     'Festival de trucks de comida internacional. Más de 30 opciones gastronómicas.',
     '2026-04-18 12:00:00', 'Parque Kennedy', 2000, 1456, 15.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE CINE
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Festival de Cine de Lima 2026', 
     'El festival de cine más importante de Latinoamérica. Proyecciones, charlas con directores y premiaciones.',
     '2026-10-05 18:00:00', 'Cineplanet y others', 5000, 2300, 40.00, NOW(), NOW()),

    (gen_random_uuid(), 'Estreno: El Último Sol', 
     'Preestreno de la nueva película nacional dirigida por Claudio. Followed by Q&A con el director.',
     '2026-04-30 20:00:00', 'Cine Teatro Lima', 350, 42, 65.00, NOW(), NOW()),

    (gen_random_uuid(), 'Cine al Aire Libre: Clásicos del Cine', 
     'Noches de cine gratuito en el parque. Proyección de películas clásicas del cine mundial.',
     '2026-12-15 19:30:00', 'Parque de la Zona 7', 500, 312, 0.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS DE NETWORKING
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Networking de Negocios - Lima Business', 
     'Conecta con empresarios y emprendedores de Lima. Sesiones de networking y pitch rápido.',
     '2026-05-10 18:00:00', 'Hotel Country Club', 150, 67, 100.00, NOW(), NOW()),

    (gen_random_uuid(), 'Emprende: De la Idea al Negocio', 
     'Workshop intensivo para emprendedores. Aprende a validar tu idea de negocio.',
     '2026-06-05 09:00:00', 'Innhub', 80, 12, 150.00, NOW(), NOW()),

    (gen_random_uuid(), 'Meetup de Startups Peruvianas', 
     'Comunidad de startups. Comparte experiencias con founders de empresas exitosas.',
     '2026-07-25 19:00:00', 'Avenue Cowork', 100, 78, 35.00, NOW(), NOW()),

-- -----------------------------------------------------------------------------
-- EVENTOS GENERALES (sin categoría específica)
-- -----------------------------------------------------------------------------

    (gen_random_uuid(), 'Feria del Libro 2026', 
     'La feria del libro más grande del país. Presents con autores, firmas de libros y descuentos.',
     '2026-11-01 10:00:00', 'Parque de la Exposición', 10000, 5600, 10.00, NOW(), NOW()),

    (gen_random_uuid(), 'Conferencia: El Futuro del Trabajo', 
     'Charla sobre tendencias laborales, trabajo remoto y habilidades del futuro.',
     '2026-08-08 16:00:00', 'Auditorio zp', 250, 189, 75.00, NOW(), NOW()),

    (gen_random_uuid(), 'Mercado de Artesanos', 
     'Compra artesanías únicas feitas a mano. Textiles, cerámicas y joyería tradicional.',
     '2026-04-12 09:00:00', 'Plaza de Armas', 200, 145, 0.00, NOW(), NOW());

-- -----------------------------------------------------------------------------
-- Verificar datos insertados
-- -----------------------------------------------------------------------------
SELECT name, event_date, venue, price, total_capacity, available_tickets 
FROM events 
ORDER BY event_date;

-- Contar eventos por categoría aproximada (basado en palabras clave)
SELECT 
    CASE 
        WHEN LOWER(name) LIKE '%tecnología%' OR LOWER(name) LIKE '%tech%' OR LOWER(name) LIKE '%ia%' OR LOWER(description) LIKE '%inteligencia artificial%' OR LOWER(description) LIKE '%software%' THEN 'Tecnología'
        WHEN LOWER(name) LIKE '%música%' OR LOWER(name) LIKE '%concierto%' OR LOWER(name) LIKE '%jazz%' OR LOWER(name) LIKE '%rock%' OR LOWER(name) LIKE '%festival%' OR LOWER(description) LIKE '%música%' THEN 'Música'
        WHEN LOWER(name) LIKE '%arte%' OR LOWER(name) LIKE '%exposición%' OR LOWER(name) LIKE '%galería%' OR LOWER(name) LIKE '%pintura%' OR LOWER(name) LIKE '%escultura%' THEN 'Arte'
        WHEN LOWER(name) LIKE '%deportes%' OR LOWER(name) LIKE '%fútbol%' OR LOWER(name) LIKE '%carrera%' OR LOWER(name) LIKE '%maratón%' OR LOWER(name) LIKE '%tenis%' THEN 'Deportes'
        WHEN LOWER(name) LIKE '%gastronomía%' OR LOWER(name) LIKE '%comida%' OR LOWER(name) LIKE '%restaurante%' OR LOWER(name) LIKE '%cata%' OR LOWER(name) LIKE '%vinos%' THEN 'Gastronomía'
        WHEN LOWER(name) LIKE '%cine%' OR LOWER(name) LIKE '%película%' OR LOWER(name) LIKE '%festival de cine%' OR LOWER(description) LIKE '%estreno%' THEN 'Cine'
        WHEN LOWER(name) LIKE '%networking%' OR LOWER(name) LIKE '%negocios%' OR LOWER(name) LIKE '%emprendimiento%' OR LOWER(name) LIKE '%startup%' THEN 'Networking'
        ELSE 'General'
    END as categoria,
    COUNT(*) as total
FROM events
GROUP BY categoria
ORDER BY categoria;
