-- Önce mevcut tabloları temizle
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- Tests tablosunu oluştur
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('turkce', 'matematik')),
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Örnek veri ekle (İsteğe bağlı)
INSERT INTO tests (title, category, questions, created_at) VALUES
(
    'Türkçe Test 1: Eş Anlamlı Kelimeler',
    'turkce',
    '[
        {
            "question": "Aşağıdakilerden hangisi \"okul\" kelimesinin eş anlamlısıdır?",
            "options": ["A) Ev", "B) Mektep", "C) Bahçe", "D) Kitap"],
            "answer": "B"
        },
        {
            "question": "Aşağıdakilerden hangisi \"kalp\" kelimesinin eş anlamlısıdır?",
            "options": ["A) Yürek", "B) Beyin", "C) Kafa", "D) El"],
            "answer": "A"
        },
        {
            "question": "Aşağıdakilerden hangisi \"öğretmen\" kelimesinin eş anlamlısıdır?",
            "options": ["A) Öğrenci", "B) Müdür", "C) Muallim", "D) Veli"],
            "answer": "C"
        }
    ]',
    NOW() - INTERVAL '2 days'
),
(
    'Türkçe Test 2: Zıt Anlamlı Kelimeler',
    'turkce',
    '[
        {
            "question": "Aşağıdakilerden hangisi \"sıcak\" kelimesinin zıt anlamlısıdır?",
            "options": ["A) Soğuk", "B) Ilık", "C) Serin", "D) Yakıcı"],
            "answer": "A"
        },
        {
            "question": "Aşağıdakilerden hangisi \"uzun\" kelimesinin zıt anlamlısıdır?",
            "options": ["A) Orta", "B) Kısa", "C) Kalın", "D) İnce"],
            "answer": "B"
        },
        {
            "question": "Aşağıdakilerden hangisi \"gece\" kelimesinin zıt anlamlısıdır?",
            "options": ["A) Akşam", "B) Sabah", "C) Gündüz", "D) Öğle"],
            "answer": "C"
        }
    ]',
    NOW() - INTERVAL '1 day'
),
(
    'Türkçe Test 3: Harf Bilgisi',
    'turkce',
    '[
        {
            "question": "Aşağıdaki kelimelerden hangisinde kalın ünlü vardır?",
            "options": ["A) Kedi", "B) Süt", "C) Kol", "D) İnce"],
            "answer": "C"
        },
        {
            "question": "Aşağıdaki kelimelerden hangisinde ince ünlü vardır?",
            "options": ["A) Kalem", "B) Fare", "C) Masa", "D) Kol"],
            "answer": "B"
        },
        {
            "question": "Aşağıdaki kelimelerden hangisinin ilk harfi sessiz harftir?",
            "options": ["A) Araba", "B) Elma", "C) İnek", "D) Kalem"],
            "answer": "D"
        }
    ]',
    NOW()
),
(
    'Matematik Test 1: Toplama İşlemi',
    'matematik',
    '[
        {
            "question": "5 + 3 = ?",
            "options": ["A) 7", "B) 8", "C) 9", "D) 10"],
            "answer": "B"
        },
        {
            "question": "12 + 8 = ?",
            "options": ["A) 18", "B) 19", "C) 20", "D) 21"],
            "answer": "C"
        },
        {
            "question": "25 + 25 = ?",
            "options": ["A) 40", "B) 45", "C) 50", "D) 55"],
            "answer": "C"
        }
    ]',
    NOW() - INTERVAL '3 days'
),
(
    'Matematik Test 2: Çıkarma İşlemi',
    'matematik',
    '[
        {
            "question": "10 - 4 = ?",
            "options": ["A) 5", "B) 6", "C) 7", "D) 8"],
            "answer": "B"
        },
        {
            "question": "20 - 7 = ?",
            "options": ["A) 12", "B) 13", "C) 14", "D) 15"],
            "answer": "B"
        },
        {
            "question": "30 - 15 = ?",
            "options": ["A) 10", "B) 15", "C) 20", "D) 25"],
            "answer": "B"
        }
    ]',
    NOW() - INTERVAL '1 day'
),
(
    'Matematik Test 3: Sayılar',
    'matematik',
    '[
        {
            "question": "Aşağıdaki sayılardan hangisi çift sayıdır?",
            "options": ["A) 3", "B) 5", "C) 7", "D) 8"],
            "answer": "D"
        },
        {
            "question": "Aşağıdaki sayılardan hangisi tek sayıdır?",
            "options": ["A) 2", "B) 4", "C) 7", "D) 10"],
            "answer": "C"
        },
        {
            "question": "Sayı doğrusunda 5 sayısından sonra hangi sayı gelir?",
            "options": ["A) 4", "B) 5", "C) 6", "D) 7"],
            "answer": "C"
        }
    ]',
    NOW()
);

-- RLS (Row Level Security) politikaları - İsteğe bağlı
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Herkesin test verilerini görmesine izin ver
CREATE POLICY "Tests herkese açık" ON tests FOR SELECT USING (true);

-- Herkesin test eklemesine izin ver
CREATE POLICY "Tests ekleme izni" ON tests FOR INSERT WITH CHECK (true);

-- Herkesin test silmesine izin ver
CREATE POLICY "Tests silme izni" ON tests FOR DELETE USING (true);

-- Yorumlar:
-- 1. Yukarıdaki SQL kodu, tests tablosunu oluşturur ve örnek veriler ekler.
-- 2. questions alanı JSONB türünde ve belirtilen formatta soru dizilerini içerir.
-- 3. category alanı için kısıtlama eklenmiştir (sadece 'turkce' veya 'matematik' olabilir).
-- 4. created_at alanı, otomatik olarak ekleme zamanını kaydeder ve testlerin tarihe göre sıralanmasını sağlar.
-- 5. Örnek veriler, farklı günlerde oluşturulmuş gibi gösterilmiştir (bugün, dün ve önceki günler).
