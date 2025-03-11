# 2. Sınıf Eğitim Uygulaması

## Yerel Geliştirme

1. Repoyu klonlayın
2. `config.example.js` dosyasını `config.js` olarak kopyalayın
3. `config.js` dosyasında API anahtarlarınızı ayarlayın
4. Yerel bir web sunucusu ile çalıştırın (örn. Live Server VSCode eklentisi)

## Vercel'de Yayınlama

1. Repoyu GitHub'a push edin (API anahtarları olmadan)
2. Vercel'de yeni proje oluşturun ve GitHub reponuzu bağlayın
3. Vercel'de deploy ettikten sonra:
   - `config.vercel.js` dosyasını yerel olarak düzenleyin ve API anahtarlarınızı ekleyin
   - Vercel dashboard'dan "Files" bölümüne gidin
   - `config.vercel.js` dosyasını yükleyin ve `config.js` olarak yeniden adlandırın

Bu şekilde API anahtarlarınız GitHub'da olmadan Vercel'de çalışacaktır.

## Önemli Notlar

- API anahtarlarını içeren dosyaları (`config.js` ve `config.vercel.js`) asla GitHub'a push etmeyin
- Bu dosyalar `.gitignore` içinde tanımlıdır, bu nedenle yanlışlıkla commit edilmezler
- Vercel'de dosya yükleme ve yeniden adlandırma işlemi, API anahtarlarınızı GitHub'a yüklemeden kullanmanızı sağlar 