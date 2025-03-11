// Supabase client oluştur (global değişkenlerden)
// Supabase UMD paketi, global isim alanına bir 'supabase' nesnesi ekler
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Tarih formatlama fonksiyonu
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tarih bugün mü kontrol et
    if (date.toDateString() === today.toDateString()) {
        return 'Bugün';
    }
    
    // Tarih dün mü kontrol et
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Dün';
    }
    
    // Diğer tarihler için normal format
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

// Tarih bugün mü kontrolü
const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

// Test yükleme fonksiyonu
const fetchTests = async (category) => {
    try {
        const { data, error } = await supabaseClient
            .from('tests')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Tests yüklenirken hata:', error);
            return [];
        }
        
        // Bugün olanları üste getir
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return data.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            const isDateAToday = dateA.toDateString() === today.toDateString();
            const isDateBToday = dateB.toDateString() === today.toDateString();
            
            if (isDateAToday && !isDateBToday) {
                return -1;
            } else if (!isDateAToday && isDateBToday) {
                return 1;
            } else {
                return dateB - dateA; // Tarih sıralaması (yeniden eskiye)
            }
        });
    } catch (error) {
        console.error('Tests yüklenirken beklenmeyen hata:', error);
        return [];
    }
};

// Soru verilerini parse etme fonksiyonu
const parseQuestions = (questionsData) => {
    try {
        if (!questionsData) return [];
        
        // Already an array
        if (Array.isArray(questionsData)) {
            return questionsData;
        }
        
        // String ise parse et
        if (typeof questionsData === 'string') {
            return JSON.parse(questionsData);
        }
        
        // Obje ama array değilse, stringify edip parse et
        return JSON.parse(JSON.stringify(questionsData));
    } catch (error) {
        console.error('Sorular parse edilirken hata:', error);
        return [];
    }
};

// Test Component
const TestItem = ({ test, onSelect }) => {
    // Parse questions count safely
    const getQuestionsCount = (questionsData) => {
        try {
            if (!questionsData) return 0;
            
            // If it's already an array, just return its length
            if (Array.isArray(questionsData)) {
                return questionsData.length;
            }
            
            // If it's a string, parse it
            if (typeof questionsData === 'string') {
                return JSON.parse(questionsData).length;
            }
            
            // If it's an object but not an array, convert to string then parse
            return JSON.parse(JSON.stringify(questionsData)).length;
        } catch (error) {
            console.error('Error parsing questions:', error);
            return 0;
        }
    };
    
    // Bugünkü testler için özel sınıf ekle
    const testClass = isToday(test.created_at) ? "test-item today-test" : "test-item";
    
    return (
        <div className={testClass} onClick={() => onSelect(test)}>
            <h3>{test.title}</h3>
            <div className="test-meta">
                <span className="test-date">{formatDate(test.created_at)}</span>
                <span className="test-questions">{getQuestionsCount(test.questions)} Soru</span>
            </div>
        </div>
    );
};

// Test Soruları Görünümü Bileşeni
const TestView = ({ test, onBackClick }) => {
    const [questions, setQuestions] = React.useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [selectedOption, setSelectedOption] = React.useState(null);
    const [showResult, setShowResult] = React.useState(false);
    const [score, setScore] = React.useState(0);
    const [userAnswers, setUserAnswers] = React.useState({});
    const [explanations, setExplanations] = React.useState({});
    const [showExplanation, setShowExplanation] = React.useState(false);
    const [isCorrect, setIsCorrect] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentAudio, setCurrentAudio] = React.useState(null);
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
        // Test verisi geldiğinde, soruları ayarla
        const parsedQuestions = parseQuestions(test.questions);
        setQuestions(parsedQuestions);
        
        // State'leri sıfırla
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowResult(false);
        setScore(0);
        setUserAnswers({});
        setExplanations({});
        setShowExplanation(false);
    }, [test]);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    const handleOptionSelect = async (optionIndex) => {
        if (isLoading) return; // Yükleme sırasında tıklamaları engelle
        
        setSelectedOption(optionIndex);
        
        // Kullanıcının cevabını kaydet
        const updatedAnswers = {...userAnswers};
        updatedAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(updatedAnswers);
        
        // Doğru cevabı kontrol et
        if (currentQuestion) {
            const correctAnswer = currentQuestion.answer.charAt(0).toUpperCase();
            const correctIndex = "ABCD".indexOf(correctAnswer);
            const correct = optionIndex === correctIndex;
            setIsCorrect(correct);
            
            // AI açıklaması daha önce alınmadıysa, API'den al
            if (!explanations[currentQuestionIndex]) {
                try {
                    setIsLoading(true);
                    const userAnswer = String.fromCharCode(65 + optionIndex); // A, B, C, D
                    
                    // AI açıklamasını getir
                    const explanation = await window.QuizServices.getQuestionExplanation(
                        currentQuestion, 
                        userAnswer, 
                        correct
                    );
                    
                    // Açıklamayı kaydet
                    const updatedExplanations = {...explanations};
                    updatedExplanations[currentQuestionIndex] = explanation;
                    setExplanations(updatedExplanations);
                    
                    // Açıklamayı göster
                    setShowExplanation(true);
                    
                    // Açıklamayı seslendir
                    setIsPlaying(true);
                    try {
                        // Önceki sesi durdur
                        if (currentAudio) {
                            currentAudio.pause();
                        }
                        
                        // Yeni açıklamayı seslendir
                        const audio = await window.QuizServices.speakExplanation(explanation);
                        setCurrentAudio(audio);
                        
                        // Ses bittiğinde çalma durumunu güncelle
                        if (audio) {
                            audio.onended = () => {
                                setIsPlaying(false);
                            };
                        } else {
                            setIsPlaying(false);
                        }
                    } catch (audioError) {
                        console.error("Seslendirme hatası:", audioError);
                        setIsPlaying(false);
                    }
                } catch (error) {
                    console.error("Açıklama alınırken hata:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Açıklama zaten varsa, hemen göster ve seslendir
                setShowExplanation(true);
                
                // Açıklamayı seslendir
                setIsPlaying(true);
                try {
                    // Önceki sesi durdur
                    if (currentAudio) {
                        currentAudio.pause();
                    }
                    
                    // Mevcut açıklamayı seslendir
                    const audio = await window.QuizServices.speakExplanation(explanations[currentQuestionIndex]);
                    setCurrentAudio(audio);
                    
                    // Ses bittiğinde çalma durumunu güncelle
                    if (audio) {
                        audio.onended = () => {
                            setIsPlaying(false);
                        };
                    } else {
                        setIsPlaying(false);
                    }
                } catch (audioError) {
                    console.error("Seslendirme hatası:", audioError);
                    setIsPlaying(false);
                }
            }
        }
    };
    
    const handleNextClick = () => {
        // Önceki sesi durdur
        if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
        }
        setIsPlaying(false);
        setShowExplanation(false);
        
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(userAnswers[currentQuestionIndex + 1] || null);
        } else {
            // Son soruysa, sonuçları göster
            calculateScore();
            setShowResult(true);
            
            // Eğer tüm soruları doğru cevapladıysa konfeti göster
            const totalCorrect = Object.keys(userAnswers).reduce((count, qIndex) => {
                const question = questions[qIndex];
                const userAnswer = userAnswers[qIndex];
                const correctAnswer = question.answer.charAt(0).toUpperCase();
                const correctIndex = "ABCD".indexOf(correctAnswer);
                
                return userAnswer === correctIndex ? count + 1 : count;
            }, 0);
            
            if (totalCorrect === questions.length || totalCorrect >= questions.length * 0.8) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
        }
    };
    
    const handlePrevClick = () => {
        // Önceki sesi durdur
        if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
        }
        setIsPlaying(false);
        setShowExplanation(false);
        
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setSelectedOption(userAnswers[currentQuestionIndex - 1] || null);
        }
    };

    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = question.answer.charAt(0).toUpperCase();
            const optionIndex = "ABCD".indexOf(correctAnswer);
            
            if (userAnswer === optionIndex) {
                correctCount++;
            }
        });
        
        setScore(correctCount);
    };
    
    // İlerleme yüzdesini hesapla
    const calculateProgress = () => {
        if (!questions.length) return 0;
        const answeredCount = Object.keys(userAnswers).length;
        return (answeredCount / questions.length) * 100;
    };
    
    if (!currentQuestion) {
        return <div className="loading">Sorular yükleniyor...</div>;
    }
    
    // Seçilen cevabın doğru olup olmadığını kontrol et
    const isAnswerCorrect = () => {
        if (selectedOption === null) return null;
        
        const correctAnswer = currentQuestion.answer.charAt(0).toUpperCase();
        const correctIndex = "ABCD".indexOf(correctAnswer);
        
        return selectedOption === correctIndex;
    };
    
    const currentExplanation = explanations[currentQuestionIndex];
    
    // Konfeti efekti
    const renderConfetti = () => {
        if (!showConfetti) return null;
        
        return (
            <div className="confetti-container">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="confetti" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
                        }}
                    />
                ))}
            </div>
        );
    };
    
    return (
        <div className="test-view">
            {renderConfetti()}
            <div className="test-view-header">
                <button className="back-button" onClick={onBackClick}>
                    Geri
                </button>
                <h2 className="test-title">{test.title}</h2>
            </div>
            
            {!showResult && (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                    <div className="question-counter">
                        {currentQuestionIndex + 1} / {questions.length}
                    </div>
                </div>
            )}
            
            {showResult ? (
                <div className="score-container">
                    <div className="score-title">Sonucunuz</div>
                    <div className="score-value">{score} / {questions.length}</div>
                    <div className="score-percentage">
                        {Math.round((score / questions.length) * 100)}%
                    </div>
                    <div className="result-message">
                        {score === questions.length 
                            ? "Harika! Tüm soruları doğru cevapladın!" 
                            : score >= questions.length * 0.8 
                                ? "Çok iyi! Neredeyse hepsini doğru cevapladın!"
                                : score >= questions.length / 2 
                                    ? "İyi iş! Birazcık daha çalışırsan daha da iyi olacak!" 
                                    : "Daha fazla çalışmaya ne dersin? Bir dahaki sefere daha iyi olacak!"}
                    </div>
                    <div className="question-summary">
                        {questions.map((question, index) => {
                            const userAnswer = userAnswers[index];
                            const correctAnswer = question.answer.charAt(0).toUpperCase();
                            const correctIndex = "ABCD".indexOf(correctAnswer);
                            const isCorrect = userAnswer === correctIndex;
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}
                                >
                                    <span className="question-number">{index + 1}</span>
                                    <span className="result-icon">{isCorrect ? '✓' : '✗'}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button 
                        className="start-button" 
                        onClick={onBackClick}
                    >
                        Testlere Dön
                    </button>
                </div>
            ) : (
                <>
                    <div className="question-container">
                        <div className="question-text">
                            {currentQuestionIndex + 1}. {currentQuestion.question}
                        </div>
                        <div className="options-list">
                            {currentQuestion.options.map((option, index) => {
                                let optionClass = "option-button";
                                
                                if (selectedOption === index) {
                                    optionClass += " selected";
                                    
                                    // Seçim yapıldı ve açıklama görüntüleniyorsa, doğru/yanlış stilini uygula
                                    if (showExplanation) {
                                        const correctAnswer = currentQuestion.answer.charAt(0).toUpperCase();
                                        const correctIndex = "ABCD".indexOf(correctAnswer);
                                        
                                        if (index === correctIndex) {
                                            optionClass += " correct";
                                        } else if (index === selectedOption) {
                                            optionClass += " incorrect";
                                        }
                                    }
                                }
                                
                                return (
                                    <button
                                        key={index}
                                        className={optionClass}
                                        onClick={() => handleOptionSelect(index)}
                                        data-option={String.fromCharCode(65 + index)}
                                        disabled={showExplanation}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {isLoading && (
                        <div className="explanation loading-explanation">
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>Açıklama hazırlanıyor...</p>
                        </div>
                    )}
                    
                    {showExplanation && currentExplanation && (
                        <div className={`explanation ${isCorrect ? 'correct-explanation' : 'incorrect-explanation'}`}>
                            {isPlaying && (
                                <div className="audio-indicator">
                                    <div className="audio-wave">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                            <p>{currentExplanation}</p>
                        </div>
                    )}
                    
                    <div className="navigation-buttons">
                        <button 
                            className="nav-button prev-button" 
                            onClick={handlePrevClick}
                            disabled={currentQuestionIndex === 0}
                        >
                            Önceki Soru
                        </button>
                        <button 
                            className="nav-button next-button" 
                            onClick={handleNextClick}
                            disabled={selectedOption === null || isLoading}
                        >
                            {currentQuestionIndex < questions.length - 1 ? 'Sonraki Soru' : 'Testi Bitir'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Tests List Component
const TestsList = ({ category, onBackClick, onTestSelect }) => {
    const [tests, setTests] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const loadTests = async () => {
            setLoading(true);
            const testsData = await fetchTests(category);
            setTests(testsData);
            setLoading(false);
        };
        
        loadTests();
    }, [category]);
    
    return (
        <div className="tests-container">
            <div className="tests-header">
                <button className="back-button" onClick={onBackClick}>
                    Geri
                </button>
                <h2>{category === 'turkce' ? 'Türkçe' : 'Matematik'} Testleri</h2>
            </div>
            
            {loading ? (
                <div className="loading">Testler yükleniyor...</div>
            ) : tests.length > 0 ? (
                <div className="tests-list">
                    {tests.map(test => (
                        <TestItem 
                            key={test.id} 
                            test={test} 
                            onSelect={onTestSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="no-tests">
                    <p>Henüz hiç test bulunmuyor.</p>
                    <p>Lütfen daha sonra tekrar deneyin.</p>
                </div>
            )}
        </div>
    );
};

// Test Ekleme Sayfası
const TestAddPage = () => {
    const [title, setTitle] = React.useState('');
    const [category, setCategory] = React.useState('turkce');
    const [jsonData, setJsonData] = React.useState('');
    const [tests, setTests] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    
    // Sayfa yüklendiğinde testleri getir
    React.useEffect(() => {
        fetchAllTests();
    }, []);
    
    // Tüm testleri getir
    const fetchAllTests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('tests')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            console.log("Getirilen testler:", data);
            setTests(data || []);
        } catch (err) {
            console.error('Testler yüklenirken hata:', err);
            setError('Testler yüklenemedi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Test ekle
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            // JSON verilerini doğrula
            let questionsData;
            try {
                questionsData = JSON.parse(jsonData);
                if (!Array.isArray(questionsData)) {
                    throw new Error('Soru verileri bir dizi (array) olmalıdır!');
                }
                
                // Soru formatını kontrol et
                for (const question of questionsData) {
                    if (!question.question || !question.options || !question.answer) {
                        throw new Error('Her soru "question", "options" ve "answer" alanlarını içermelidir!');
                    }
                    
                    if (!Array.isArray(question.options) || question.options.length < 2) {
                        throw new Error('Her sorunun en az 2 şıkkı olmalıdır!');
                    }
                }
            } catch (err) {
                setError('JSON verileri geçersiz: ' + err.message);
                setLoading(false);
                return;
            }
            
            // Yeni test kaydı
            const { data, error } = await supabaseClient
                .from('tests')
                .insert([
                    { 
                        title, 
                        category, 
                        questions: questionsData
                    },
                ])
                .select();
                
            if (error) throw error;
            
            // Başarılı
            setSuccess('Test başarıyla eklendi!');
            setTitle('');
            setJsonData('');
            
            // Testleri yeniden yükle
            fetchAllTests();
        } catch (err) {
            console.error('Test eklenirken hata:', err);
            setError('Test eklenemedi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Test sil
    const handleDeleteTest = async (id) => {
        if (!confirm('Bu testi silmek istediğinize emin misiniz?')) {
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            console.log("Silinecek test ID:", id);
            
            // Veri tabanından sil
            const { error } = await supabaseClient
                .from('tests')
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error("Supabase silme hatası:", error);
                throw error;
            }
            
            // UI'dan kaldır (state'i manuel güncelle)
            setTests(prevTests => prevTests.filter(test => test.id !== id));
            
            console.log("Test başarıyla silindi!");
            setSuccess('Test başarıyla silindi!');
        } catch (err) {
            console.error('Test silinirken hata:', err);
            setError('Test silinemedi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Örnek JSON şablonu
    const exampleJsonTemplate = [
        {
            "question": "Soru metni buraya yazılır?",
            "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
            "answer": "A"
        },
        {
            "question": "İkinci soru örneği buraya yazılır?",
            "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
            "answer": "B"
        }
    ];
    
    // JSON Yardım bilgisini göster/gizle
    const [showJsonHelp, setShowJsonHelp] = React.useState(false);
    
    // JSON yardım bilgisi
    const toggleJsonHelp = () => {
        setShowJsonHelp(!showJsonHelp);
    };
    
    return (
        <div className="test-add-page">
            <h1>Test Ekleme Sayfası</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="test-add-container">
                <div className="test-form-container">
                    <h2>Yeni Test Ekle</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="title">Test Başlığı:</label>
                            <input 
                                type="text" 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="Test başlığını girin" 
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="category">Kategori:</label>
                            <select 
                                id="category" 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="turkce">Türkçe</option>
                                <option value="matematik">Matematik</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="jsonData">Soru Verileri (JSON formatında):</label>
                            <textarea 
                                id="jsonData" 
                                value={jsonData} 
                                onChange={(e) => setJsonData(e.target.value)} 
                                placeholder="JSON formatında soru verilerini girin..." 
                                required 
                            />
                            
                            <div className="json-help">
                                <button 
                                    type="button" 
                                    className="help-button" 
                                    onClick={toggleJsonHelp}
                                >
                                    {showJsonHelp ? "Yardımı Gizle" : "JSON Format Yardımı"}
                                </button>
                                
                                {showJsonHelp && (
                                    <div className="json-format-info">
                                        <p>Sorular şu JSON formatında olmalıdır:</p>
                                        <pre>{JSON.stringify(exampleJsonTemplate, null, 2)}</pre>
                                        <p>Gerekli alanlar:</p>
                                        <ul>
                                            <li><strong>question</strong>: Soru metni</li>
                                            <li><strong>options</strong>: Şıkların listesi (dizi içinde)</li>
                                            <li><strong>answer</strong>: Doğru cevap (A, B, C veya D)</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="submit-button" 
                            disabled={loading || !title || !jsonData}
                        >
                            {loading ? "Ekleniyor..." : "Test Ekle"}
                        </button>
                    </form>
                </div>
                
                <div className="tests-list-container">
                    <h2>Mevcut Testler</h2>
                    
                    {loading && !tests.length ? (
                        <div className="loading">Testler yükleniyor...</div>
                    ) : tests.length === 0 ? (
                        <div className="no-tests">Henüz eklenmiş test bulunmamaktadır.</div>
                    ) : (
                        <div className="tests-grid">
                            {tests.map(test => (
                                <div key={test.id} className="test-card">
                                    <div className="test-card-content">
                                        <h3>{test.title}</h3>
                                        <div className="test-card-details">
                                            <span className="category-badge">
                                                {test.category === 'turkce' ? 'Türkçe' : 'Matematik'}
                                            </span>
                                            <span className="questions-count">
                                                {test.questions && Array.isArray(test.questions) ? test.questions.length : 0} Soru
                                            </span>
                                        </div>
                                        <div className="test-card-date">
                                            {formatDate(test.created_at)}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteTest(test.id)} 
                                        className="delete-button"
                                        disabled={loading}
                                    >
                                        Sil
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="back-link-container">
                <a href="#" className="back-link" onClick={() => window.location.href = "/"}>
                    Ana Sayfaya Dön
                </a>
            </div>
        </div>
    );
};

// React uygulama bileşeni
const App = () => {
    // State değişkenleri
    const [showContent, setShowContent] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState(null);
    const [selectedTest, setSelectedTest] = React.useState(null);
    const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
    
    // URL değişikliklerini dinle
    React.useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);
    
    // Karakter resmi
    const characterImage = "https://cdn-icons-png.flaticon.com/512/4213/4213641.png";

    // Ses dosyasını çalacak fonksiyon
    const playAudio = (file) => {
        const audio = new Audio(file);
        audio.play().catch(error => {
            console.error("Ses çalma hatası:", error);
        });
    };

    // Başlangıç butonu tıklandığında
    const handleStart = () => {
        playAudio('audio/welcome.mp3');
        setShowContent(true);
    };

    // Türkçe butonuna tıklandığında
    const handleTurkceClick = () => {
        playAudio('audio/turkce.mp3');
        setSelectedCategory('turkce');
    };

    // Matematik butonuna tıklandığında
    const handleMatClick = () => {
        playAudio('audio/mat.mp3');
        setSelectedCategory('matematik');
    };
    
    // Geri butonuna tıklandığında
    const handleBackClick = () => {
        if (selectedTest) {
            // Eğer test gösteriliyorsa, testler listesine dön
            setSelectedTest(null);
        } else {
            // Testler listesi gösteriliyorsa, ana menüye dön
            setSelectedCategory(null);
        }
    };
    
    // Test seçildiğinde
    const handleTestSelect = (test) => {
        console.log("Test seçildi:", test);
        setSelectedTest(test);
    };
    
    // URL değiştiğinde
    const navigateTo = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    // Test ekleme sayfası
    if (currentPath === '/test-ekle') {
        return <TestAddPage />;
    }
    
    // Ana uygulama sayfası
    // Hangi ekranı göstereceğimizi kontrol et
    const renderContent = () => {
        if (!showContent) {
            // İlk karşılama ekranı
            return (
                <button 
                    className="start-button pulse-animation" 
                    onClick={handleStart}
                >
                    Hadi Başlayalım
                </button>
            );
        }
        
        if (selectedTest) {
            // Test soruları ekranı
            return (
                <TestView 
                    test={selectedTest} 
                    onBackClick={handleBackClick}
                />
            );
        }
        
        if (selectedCategory) {
            // Testler listesi
            return (
                <TestsList 
                    category={selectedCategory} 
                    onBackClick={handleBackClick}
                    onTestSelect={handleTestSelect}
                />
            );
        }
        
        // Kategori seçim ekranı
        return (
            <>
                <img src={characterImage} className="character wiggle" alt="Character" />
                <h1>Hangi dersten test çözmek istersin?</h1>
                <div className="buttons-container">
                    <button 
                        className="subject-button turkce-button" 
                        onClick={handleTurkceClick}
                    >
                        Türkçe
                    </button>
                    <button 
                        className="subject-button mat-button" 
                        onClick={handleMatClick}
                    >
                        Matematik
                    </button>
                    <button 
                        className="subject-button test-ekle-button" 
                        onClick={() => navigateTo('/test-ekle')}
                    >
                        Test Yönetimi
                    </button>
                </div>
            </>
        );
    };
    
    return (
        <div className="app-container">
            {!showContent && (
                <div className="welcome-screen">
                    {renderContent()}
                </div>
            )}
            {showContent && renderContent()}
        </div>
    );
};

// React 18 createRoot kullanımı
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
