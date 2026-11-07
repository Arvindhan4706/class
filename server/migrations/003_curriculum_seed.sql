-- Phase 3: Bharatanatyam curriculum seed data
-- Standard Bharatanatyam repertoire across 3 levels

-- ── Level 1: Foundational (Years 1–3) ──────────────────────────────
INSERT OR IGNORE INTO curriculum (id, level, category, item, description, sort_order) VALUES
-- Adavus (Basic Steps)
('CUR-ADV-001', 'Foundation', 'Adavus', 'Tatta Adavu', 'Basic stamping sequences — foot pattern exercises', 10),
('CUR-ADV-002', 'Foundation', 'Adavus', 'Natta Adavu', 'Opening out adavu — basic jati patterns', 20),
('CUR-ADV-003', 'Foundation', 'Adavus', 'Visharu Adavu', 'Stretching adavu patterns', 30),
('CUR-ADV-004', 'Foundation', 'Adavus', 'Tattimetti Adavu', 'Heel-stamp adavu with extended patterns', 40),
('CUR-ADV-005', 'Foundation', 'Adavus', 'Mandi Adavu', 'Half-sitting adavu sequences', 50),
('CUR-ADV-006', 'Foundation', 'Adavus', 'Sarika Adavu', 'Side-movement adavu', 60),
('CUR-ADV-007', 'Foundation', 'Adavus', 'Kuditta Mettu Adavu', 'Jumping adavu patterns', 70),
('CUR-ADV-008', 'Foundation', 'Adavus', 'Mettu Adavu', 'Stepping adavu sequences', 80),

-- Hastas (Hand Gestures)
('CUR-HST-001', 'Foundation', 'Hastas', 'Asamyuta Hastas (28)', 'Single-hand gestures: Pataka, Tripataka, Ardhapataka, Kartarimukha, Mayura, Ardhachandra, Arala, Sukatunda, Mushti, Shikhara, Kapittha, Katakamukha, Suchi, Chandrakala, Padmakosha, Sarpashirsha, Mrigashirsha, Simhamukha, Kangula, Alapadma, Chatura, Bhramara, Hamsasya, Hamsapaksha, Sandamsha, Mukula, Tamrachuda, Trishula', 90),
('CUR-HST-002', 'Foundation', 'Hastas', 'Samyuta Hastas (24)', 'Combined two-hand gestures: Anjali, Kapota, Karkata, Swastika, Dola, Pushpaputa, Utsanga, Shivalinga, Katakavardhamana, Kartarimukha, Shakata, Shankha, Chakra, Samputa, Pasha, Kilaka, Matsya, Kurma, Varaha, Garuda, Nagabandha, Khatva, Bherunda, Avahitta', 100),

-- Theory
('CUR-THY-001', 'Foundation', 'Theory', 'Bharatanatyam History', 'Origins in Natya Shastra; Devadasi tradition; revival by Rukmini Devi Arundale', 110),
('CUR-THY-002', 'Foundation', 'Theory', 'Navarasas', 'Nine emotions: Shringara, Hasya, Karuna, Roudra, Vira, Bhayanaka, Bibhatsa, Adbhuta, Shanta', 120),
('CUR-THY-003', 'Foundation', 'Theory', 'Abhinaya Darpanam', 'Basic concepts from the treatise on expression', 130),

-- ── Level 2: Intermediate (Years 3–6) ──────────────────────────────
-- Compositions
('CUR-CMP-001', 'Intermediate', 'Compositions', 'Alarippu', 'Opening invocatory piece — invoking Nataraja', 200),
('CUR-CMP-002', 'Intermediate', 'Compositions', 'Jatiswaram', 'Pure dance piece set to swara patterns', 210),
('CUR-CMP-003', 'Intermediate', 'Compositions', 'Shabdam', 'First abhinaya piece with simple narrative', 220),
('CUR-CMP-004', 'Intermediate', 'Compositions', 'Varnam', 'Centrepiece of a Bharatanatyam margam; combines nritta and abhinaya', 230),

-- Nritta
('CUR-NRT-001', 'Intermediate', 'Nritta', 'Korvai sequences', 'Complex rhythmic sequences combining multiple adavus', 240),
('CUR-NRT-002', 'Intermediate', 'Nritta', 'Tirmana', 'Concluding rhythmic flourish patterns', 250),

-- Abhinaya
('CUR-ABH-001', 'Intermediate', 'Abhinaya', 'Angika Abhinaya', 'Expression through body, limbs and face', 260),
('CUR-ABH-002', 'Intermediate', 'Abhinaya', 'Vachika Abhinaya', 'Expression through voice and words', 270),
('CUR-ABH-003', 'Intermediate', 'Abhinaya', 'Aharya Abhinaya', 'Expression through costume, makeup and jewellery', 280),
('CUR-ABH-004', 'Intermediate', 'Abhinaya', 'Sattvika Abhinaya', 'Expression through inner emotional states', 290),

-- ── Level 3: Advanced / Arangetram-ready (Years 6+) ─────────────────
-- Compositions
('CUR-CMP-005', 'Advanced', 'Compositions', 'Padam', 'Devotional/lyrical piece emphasising abhinaya', 300),
('CUR-CMP-006', 'Advanced', 'Compositions', 'Javali', 'Lighter romantic/erotic piece; expressive abhinaya', 310),
('CUR-CMP-007', 'Advanced', 'Compositions', 'Thillana', 'Concluding nritta-dominant piece; high energy', 320),
('CUR-CMP-008', 'Advanced', 'Compositions', 'Mangalam', 'Closing benediction piece', 330),

-- Margam (Complete Recital)
('CUR-MRG-001', 'Advanced', 'Margam', 'Full Margam sequencing', 'Alarippu → Jatiswaram → Shabdam → Varnam → Padam → Javali → Thillana → Mangalam', 340),
('CUR-MRG-002', 'Advanced', 'Margam', 'Stage craft & presentation', 'Costume, makeup, lighting, sound cues, announcer coordination', 350),
('CUR-MRG-003', 'Advanced', 'Margam', 'Arangetram preparation', 'Solo debut recital rehearsals and guru clearance', 360),

-- Advanced Theory
('CUR-THY-004', 'Advanced', 'Theory', 'Natya Shastra study', 'Detailed study of Bharata Muni treatise relevant to Bharatanatyam', 370),
('CUR-THY-005', 'Advanced', 'Theory', 'Carnatic music for dancers', 'Understanding tala, raga and sahitya as applied to dance compositions', 380),
('CUR-THY-006', 'Advanced', 'Theory', 'Choreography & composition', 'Creating original compositions and choreographic concepts', 390);
