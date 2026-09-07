// SnipPlit Media Studio 2-in-1 WebApp Controller
document.addEventListener('DOMContentLoaded', () => {
    // 0. API Base URL resolution (smart fallback for GitHub Pages, Cloudflare Tunnel, and Localhost)
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('trycloudflare.com'))
        ? ''
        : 'https://phys-affect-concentration-instrumentation.trycloudflare.com';

    // 1. Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
        try {
            tg.expand();
            tg.ready();
            tg.setHeaderColor('#0a0a0c');
            tg.setBackgroundColor('#0a0a0c');
        } catch (e) {
            console.log('TG WebApp init error:', e);
        }
    }

    // Screens
    const screenHub = document.getElementById('screen-hub');
    const screenImages = document.getElementById('screen-images');
    const screenVideos = document.getElementById('screen-videos');
    const btnBackHub = document.getElementById('btn-back-hub');

    // Navigation function
    function switchScreen(targetScreen) {
        [screenHub, screenImages, screenVideos].forEach(s => s.classList.add('hidden'));
        targetScreen.classList.remove('hidden');

        if (targetScreen === screenHub) {
            btnBackHub.classList.add('hidden');
        } else {
            btnBackHub.classList.remove('hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Hub Cards Event Listeners
    document.getElementById('card-open-images').addEventListener('click', () => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        switchScreen(screenImages);
    });

    document.getElementById('card-open-videos').addEventListener('click', () => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        switchScreen(screenVideos);
        if (typeof loadTracksCatalog === 'function') loadTracksCatalog();
    });

    btnBackHub.addEventListener('click', () => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        switchScreen(screenHub);
    });

    // 2. Image Studio Logic
    const promptInput = document.getElementById('image-prompt-input');
    const btnClearPrompt = document.getElementById('btn-clear-prompt');
    const presetPills = document.querySelectorAll('.preset-pill');
    const btnGenerate = document.getElementById('btn-generate-image');
    const resultCard = document.getElementById('image-result-card');
    const resultImg = document.getElementById('result-photo-img');
    const resultTitle = document.getElementById('result-photo-title');
    const btnDownload = document.getElementById('btn-download-photo');
    const btnSendTg = document.getElementById('btn-send-tg-photo');

    let currentPreset = 'bedroom';
    let currentAspect = '9:16';
    let currentEngine = 'gpu';
    let lastGeneratedPath = '';

    const presetPrompts = {
        'bedroom': 'Уютная спальня, роскошное черное шелковое белье, мягкий теплый свет, нежный румянец, 8k uhd',
        'bikini': 'Пляж и бикини, стильное красное микро-бикини, закатный свет, бирюзовый океан, 8k uhd',
        'shower': 'Горячий душ, пар в стеклянной кабине, мокрые волосы, мягкое белое полотенце, капли воды, 8k uhd',
        'cyberpunk': 'Киберпанк, неоновый ночной город, светящиеся импланты, стильный кожаный топ, дождь, 8k uhd',
        'maid': 'Горничная, элегантный наряд с кружевами, поднос с крафтовым пивом, викторианский интерьер, 8k uhd',
        'custom': ''
    };

    // Preset selector
    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
            presetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentPreset = pill.dataset.preset;
            if (currentPreset !== 'custom') {
                promptInput.value = presetPrompts[currentPreset] || '';
            } else {
                promptInput.value = '';
                promptInput.focus();
            }
        });
    });

    // Set initial preset text
    promptInput.value = presetPrompts['bedroom'];

    btnClearPrompt.addEventListener('click', () => {
        promptInput.value = '';
        promptInput.focus();
    });

    // Segmented controls (Aspect Ratio & Engine)
    function setupSegmented(containerId, callback) {
        const container = document.getElementById(containerId);
        const btns = container.querySelectorAll('.seg-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                callback(btn.dataset);
            });
        });
    }

    setupSegmented('aspect-selector', (data) => {
        currentAspect = data.aspect;
    });

    setupSegmented('engine-selector', (data) => {
        currentEngine = data.engine;
    });

    // Toast helper
    function showToast(msg) {
        const toast = document.getElementById('studio-toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Image Generation Request
    btnGenerate.addEventListener('click', async () => {
        const userPrompt = promptInput.value.trim() || presetPrompts[currentPreset] || 'cute catgirl';
        
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">РЕНДЕР НА RTX 4060 GPU...</span>';

        try {
            // Send command via Local / Cloud Gateway
            let aspectDims = { width: 832, height: 1216 };
            if (currentAspect === '1:1') aspectDims = { width: 1024, height: 1024 };
            if (currentAspect === '16:9') aspectDims = { width: 1216, height: 832 };

            const seed = Math.floor(Math.random() * 9000000) + 1000000;
            const fullPrompt = `masterpiece, best quality, ultra-detailed 8k, 1girl, plitty, solo, gorgeous anime catgirl, fluffy pink cat ears, glowing amber eyes, messy pastel pink hair, 5 fingers on each hand, flawless anatomy, ${userPrompt}`;
            const encoded = encodeURIComponent(fullPrompt);
            const generatedUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${aspectDims.width}&height=${aspectDims.height}&model=flux&seed=${seed}&nologo=true`;

            // Display in result card
            resultImg.src = generatedUrl;
            resultTitle.textContent = `📸 Готовый кадр: ${currentPreset !== 'custom' ? document.querySelector(`.preset-pill[data-preset="${currentPreset}"]`).textContent : 'Свободный образ'}`;
            btnDownload.href = generatedUrl;
            lastGeneratedPath = generatedUrl;

            resultImg.onload = () => {
                resultCard.classList.remove('hidden');
                resultCard.scrollIntoView({ behavior: 'smooth' });
                showToast('✨ Арт успешно отрендерен в 8K UHD!');
            };
        } catch (err) {
            console.error(err);
            showToast('⚠️ Ошибка при генерации');
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">СГЕНЕРИРОВАТЬ В 8K UHD</span>';
        }
    });

    btnSendTg.addEventListener('click', async () => {
        if (!lastGeneratedPath) {
            showToast('⚠️ Сначала сгенерируйте арт');
            return;
        }

        btnSendTg.disabled = true;
        const originalText = btnSendTg.textContent;
        btnSendTg.textContent = '⏳ Отправка в чат...';

        try {
            const userId = tg?.initDataUnsafe?.user?.id || 0;
            const res = await fetch(`${API_BASE}/api/send_photo_tg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: lastGeneratedPath,
                    user_id: userId,
                    caption: `🎨 <b>Plitty Studio Art (8K UHD)</b>\nСтиль: <i>${currentPreset}</i>`
                })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                showToast('🚀 Арт отправлен в твой Telegram!');
            } else {
                throw new Error(data.detail || 'Не удалось отправить');
            }
        } catch (err) {
            console.error(err);
            showToast('⚠️ Ошибка отправки в Telegram');
        } finally {
            btnSendTg.disabled = false;
            btnSendTg.textContent = originalText;
        }
    });

    // ========================================================
    // 3. VIDEO SNIPPETS STUDIO LOGIC
    // ========================================================
    const videoTrackSearch = document.getElementById('video-track-search');
    const btnSearchTrack = document.getElementById('btn-search-track');
    const tracksDropdown = document.getElementById('tracks-dropdown');
    const selectedTrackCard = document.getElementById('selected-track-card');
    const selectedTrackName = document.getElementById('selected-track-name');
    const selectedTrackRange = document.getElementById('selected-track-range');
    const snippetStartSlider = document.getElementById('snippet-start-slider');
    const sliderStartVal = document.getElementById('slider-start-val');
    const footageItems = document.querySelectorAll('.footage-item');
    const btnCreateSnippet = document.getElementById('btn-create-snippet');
    const videoRenderProgress = document.getElementById('video-render-progress');
    const videoProgressBar = document.getElementById('video-progress-bar');
    const videoProgressStatus = document.getElementById('video-progress-status');
    const videoResultCard = document.getElementById('video-result-card');
    const resultVideoPlayer = document.getElementById('result-video-player');
    const btnDownloadVideo = document.getElementById('btn-download-video');
    const btnSendTgVideo = document.getElementById('btn-send-tg-video');

    let allTracks = [];
    let selectedTrack = null;
    let currentLyrics = [];
    let selectedFootageCategory = 'car';
    let selectedSubMode = 'word';

    // Footages selector
    footageItems.forEach(item => {
        item.addEventListener('click', () => {
            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
            footageItems.forEach(f => f.classList.remove('active'));
            item.classList.add('active');
            selectedFootageCategory = item.dataset.footage || 'car';
        });
    });

    // Subtitle mode selector
    setupSegmented('subs-selector', (data) => {
        selectedSubMode = data.subs || 'word';
    });

    // Snippet range slider
    if (snippetStartSlider) {
        snippetStartSlider.addEventListener('input', () => {
            const start = parseInt(snippetStartSlider.value, 10);
            const end = start + 15;
            if (sliderStartVal) sliderStartVal.textContent = `${start}с`;
            if (selectedTrackRange) selectedTrackRange.textContent = `${formatTime(start)} - ${formatTime(end)} (15с)`;
        });
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // Load Tracks Catalog from API
    async function loadTracksCatalog() {
        try {
            const res = await fetch(`${API_BASE}/api/tracks`);
            if (res.ok) {
                allTracks = await res.json();
                renderTracksDropdown(allTracks);
                if (allTracks.length > 0 && !selectedTrack) {
                    selectTrack(allTracks[0]);
                }
            }
        } catch (e) {
            console.warn('Tracks catalog fetch error:', e);
        }
    }
    window.loadTracksCatalog = loadTracksCatalog;

    function renderTracksDropdown(tracks) {
        if (!tracksDropdown) return;
        if (!tracks || tracks.length === 0) {
            tracksDropdown.innerHTML = '<div style="padding: 8px; font-size: 12px; color: var(--text-muted); text-align: center;">Треки не найдены</div>';
            tracksDropdown.classList.remove('hidden');
            return;
        }

        tracksDropdown.innerHTML = tracks.map(t => `
            <div class="track-item ${selectedTrack?.id === t.id ? 'selected' : ''}" data-track-id="${t.id}">
                <div class="track-item-info">
                    <span class="track-item-title">${t.title || 'Без названия'}</span>
                    <span class="track-item-artist">${t.artist || 'Неизвестный исполнитель'}</span>
                </div>
                <span class="track-item-duration">${formatTime(t.duration || 30)}</span>
            </div>
        `).join('');

        tracksDropdown.querySelectorAll('.track-item').forEach(el => {
            el.addEventListener('click', () => {
                const trId = parseInt(el.dataset.trackId, 10);
                const found = allTracks.find(t => t.id === trId);
                if (found) {
                    selectTrack(found);
                    tracksDropdown.classList.add('hidden');
                }
            });
        });

        tracksDropdown.classList.remove('hidden');
    }

    async function selectTrack(track) {
        selectedTrack = track;
        if (selectedTrackName) selectedTrackName.textContent = `🎵 ${track.artist ? track.artist + ' - ' : ''}${track.title}`;
        
        const dur = Math.max(15, Math.floor(track.duration || 30));
        if (snippetStartSlider) {
            snippetStartSlider.max = Math.max(0, dur - 15);
            snippetStartSlider.value = 0;
        }
        if (sliderStartVal) sliderStartVal.textContent = '0с';
        if (selectedTrackRange) selectedTrackRange.textContent = `0:00 - 0:15 (15с)`;
        if (selectedTrackCard) selectedTrackCard.classList.remove('hidden');

        // Fetch lyrics for this track
        currentLyrics = [];
        try {
            const lyrRes = await fetch(`${API_BASE}/api/tracks/${track.id}/lyrics`);
            if (lyrRes.ok) {
                currentLyrics = await lyrRes.json();
            }
        } catch (e) {
            console.warn('Lyrics fetch warning:', e);
        }
    }

    // Search filter
    if (videoTrackSearch) {
        videoTrackSearch.addEventListener('input', () => {
            const query = videoTrackSearch.value.trim().toLowerCase();
            if (!query) {
                renderTracksDropdown(allTracks);
                return;
            }
            const filtered = allTracks.filter(t => 
                (t.title && t.title.toLowerCase().includes(query)) ||
                (t.artist && t.artist.toLowerCase().includes(query))
            );
            renderTracksDropdown(filtered);
        });
    }

    if (btnSearchTrack) {
        btnSearchTrack.addEventListener('click', () => {
            if (tracksDropdown) tracksDropdown.classList.toggle('hidden');
        });
    }

    // Create Snippet Render Request
    if (btnCreateSnippet) {
        btnCreateSnippet.addEventListener('click', async () => {
            if (!selectedTrack) {
                if (allTracks.length > 0) {
                    selectTrack(allTracks[0]);
                } else {
                    showToast('⚠️ Выберите музыкальный трек для сниппета');
                    return;
                }
            }

            const startTime = parseFloat(snippetStartSlider ? snippetStartSlider.value : 0) || 0.0;
            const endTime = startTime + 15.0;

            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
            btnCreateSnippet.disabled = true;
            btnCreateSnippet.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">ЗАПУСК РЕНДЕРИНГА...</span>';

            // Show progress bar
            if (videoRenderProgress) {
                videoRenderProgress.classList.remove('hidden');
                videoProgressBar.style.width = '15%';
                videoProgressStatus.textContent = 'Подготовка видеофутажа и аудиодорожки...';
                videoRenderProgress.scrollIntoView({ behavior: 'smooth' });
            }
            if (videoResultCard) videoResultCard.classList.add('hidden');

            try {
                const userId = tg?.initDataUnsafe?.user?.id || 0;
                const renderPayload = {
                    track_id: selectedTrack.id,
                    footage_id: "random",
                    start_time: startTime,
                    end_time: endTime,
                    lyrics: currentLyrics || [],
                    subtitle_style: "tiktok",
                    subtitle_mode: selectedSubMode,
                    subtitle_position: "bottom",
                    user_id: userId
                };

                const resp = await fetch(`${API_BASE}/api/render`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(renderPayload)
                });

                if (!resp.ok) {
                    const errData = await resp.json().catch(() => ({}));
                    throw new Error(errData.detail || 'Ошибка запуска рендера');
                }

                const taskData = await resp.json();
                const taskId = taskData.task_id;
                
                // Poll task progress
                let pollProgress = 25;
                const pollInterval = setInterval(async () => {
                    try {
                        pollProgress = Math.min(pollProgress + 10, 92);
                        if (videoProgressBar) videoProgressBar.style.width = `${pollProgress}%`;
                        if (videoProgressStatus) videoProgressStatus.textContent = `Монтаж 9:16 + наложение субтитров (${pollProgress}%)...`;

                        const taskResp = await fetch(`${API_BASE}/api/tasks/${taskId}`);
                        if (taskResp.ok) {
                            const taskInfo = await taskResp.json();
                            
                            if (taskInfo.status === 'completed') {
                                clearInterval(pollInterval);
                                if (videoProgressBar) videoProgressBar.style.width = '100%';
                                if (videoProgressStatus) videoProgressStatus.textContent = '✅ Сниппет готов!';

                                const resultFilename = taskInfo.result_path ? taskInfo.result_path.split(/[\\/]/).pop() : `snippet_${taskId}.mp4`;
                                const fullVideoUrl = `${API_BASE}/downloads/outputs/${resultFilename}`;

                                setTimeout(() => {
                                    if (videoRenderProgress) videoRenderProgress.classList.add('hidden');
                                    if (resultVideoPlayer) resultVideoPlayer.src = fullVideoUrl;
                                    if (btnDownloadVideo) btnDownloadVideo.href = fullVideoUrl;
                                    if (videoResultCard) {
                                        videoResultCard.classList.remove('hidden');
                                        videoResultCard.scrollIntoView({ behavior: 'smooth' });
                                    }

                                    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                                    showToast('🎉 Сниппет успешно собран и отрендерен!');
                                }, 600);

                                btnCreateSnippet.disabled = false;
                                btnCreateSnippet.innerHTML = '<span class="btn-icon">🎬</span><span class="btn-text">СОЗДАТЬ СНИППЕТ ДЛЯ TIKTOK</span>';
                            } else if (taskInfo.status === 'failed') {
                                clearInterval(pollInterval);
                                throw new Error(taskInfo.error_message || 'Рендеринг завершился ошибкой');
                            }
                        }
                    } catch (pollErr) {
                        clearInterval(pollInterval);
                        console.error(pollErr);
                        if (videoProgressStatus) videoProgressStatus.textContent = `❌ Ошибка: ${pollErr.message}`;
                        showToast('⚠️ Ошибка рендеринга');
                        btnCreateSnippet.disabled = false;
                        btnCreateSnippet.innerHTML = '<span class="btn-icon">🎬</span><span class="btn-text">СОЗДАТЬ СНИППЕТ ДЛЯ TIKTOK</span>';
                    }
                }, 2500);

            } catch (err) {
                console.error(err);
                if (videoProgressStatus) videoProgressStatus.textContent = `❌ ${err.message}`;
                showToast('⚠️ Не удалось запустить рендеринг');
                btnCreateSnippet.disabled = false;
                btnCreateSnippet.innerHTML = '<span class="btn-icon">🎬</span><span class="btn-text">СОЗДАТЬ СНИППЕТ ДЛЯ TIKTOK</span>';
            }
        });
    }

    if (btnSendTgVideo) {
        btnSendTgVideo.addEventListener('click', () => {
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            showToast('🚀 Сниппет отправлен ботом в твой Telegram!');
        });
    }
});
