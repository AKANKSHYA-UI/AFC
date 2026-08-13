/* ==========================================================================
   AFSANA FRIED CHICKEN — 219-FRAME SCROLL ANIMATION & LUXURY APP CORE
   ========================================================================== */

(function () {
    'use strict';

    // Configuration & Constants
    const TOTAL_FRAMES = 219;
    const FRAME_PREFIX = 'ezgif-frame-';
    const FRAME_EXT = '.jpg';

    // DOM Elements
    const canvas = document.getElementById('scroll-canvas') || document.getElementById('animation-canvas') || document.querySelector('canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const stickyContainer = document.getElementById('sticky-container');
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderPercent = document.getElementById('loader-percent');
    
    // Scrubber & Controls Elements (Safely checked)
    const frameSlider = document.getElementById('frame-slider');
    const currentFrameNum = document.getElementById('current-frame-num');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');

    // App State
    const images = [];
    let loadedCount = 0;
    let currentFrame = 1;
    let targetFrame = 1;
    let isPlaying = false;
    let playInterval = null;
    let isMuted = true;
    let audioCtx = null;

    // Cart State
    let cart = [];
    let isPromoApplied = false;

    // Story Cards & Milestones Data
    const STORY_STAGES = [
        {
            start: 0.30,
            end: 0.50,
            tag: '01 / MARINADE',
            badge: 'Step 1',
            title: '11-Spice Secret Marinade',
            desc: 'Fresh local chicken cutlets marinated for 12 hours in our secret Buxi Bazaar aromatic herb blend.'
        },
        {
            start: 0.50,
            end: 0.70,
            tag: '02 / BREADING',
            badge: 'Step 2',
            title: 'Signature Double Dredge',
            desc: 'Tossed in seasoned flour and hand-pressed to create extra-crispy, golden crunch ridges.'
        },
        {
            start: 0.70,
            end: 0.88,
            tag: '03 / GOLDEN FRY',
            badge: 'Step 3',
            title: 'Sizzling High-Heat Fry',
            desc: 'Crisped in pure high-temp vegetable oil until gleaming golden amber with tender juices locked inside.'
        },
        {
            start: 0.88,
            end: 1.00,
            tag: '04 / READY TO FEAST',
            badge: 'Step 4',
            title: 'Served Hot & Crunchy',
            desc: 'Irresistibly fresh, hot, and wildly satisfying fried chicken ready for your table!'
        }
    ];

    // Helper: Zero-pad frame numbers (e.g. 1 -> 001)
    function padFrame(num) {
        return String(num).padStart(3, '0');
    }

    // Helper: Format image path
    function getFrameUrl(index) {
        return `${FRAME_PREFIX}${padFrame(index)}${FRAME_EXT}`;
    }

    // Initialize Image Preloader
    function preloadFrames() {
        let isFirstFrameDrawn = false;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFrameUrl(i);

            img.onload = () => {
                loadedCount++;
                const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
                if (loaderBar) loaderBar.style.width = `${percent}%`;
                if (loaderPercent) loaderPercent.textContent = `${percent}%`;

                if (i === 1 && !isFirstFrameDrawn) {
                    isFirstFrameDrawn = true;
                    drawFrame(1);
                }

                if (loadedCount === TOTAL_FRAMES) {
                    onAllFramesLoaded();
                }
            };

            img.onerror = () => {
                setTimeout(() => {
                    img.src = getFrameUrl(i);
                }, 300);
            };

            images[i] = img;
        }
    }

    function onAllFramesLoaded() {
        setTimeout(() => {
            if (loaderOverlay) {
                loaderOverlay.classList.add('hidden');
            }
            resizeCanvas();
            setupInteractiveControls();
            renderLoop();
        }, 300);
    }

    const heroContainer = document.getElementById('experience') || document.querySelector('.hero-scroll-container') || document.body;

    // High-DPI Canvas Resizing & Aspect-Ratio Fitting
    function resizeCanvas() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (canvas.clientWidth || window.innerWidth) * dpr;
        canvas.height = (canvas.clientHeight || window.innerHeight) * dpr;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFrame(Math.round(currentFrame));
    }

    // Draw Frame on Canvas with full screen resolution & crisp HD rendering rules
    function drawFrame(frameIndex) {
        if (!ctx || !canvas) return;
        const index = Math.min(Math.max(Math.round(frameIndex), 1), TOTAL_FRAMES);
        const img = images[index];

        if (!img || !img.complete || img.naturalWidth === 0) return;

        const clientW = canvas.clientWidth || window.innerWidth;
        const clientH = canvas.clientHeight || window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        const targetW = Math.round(clientW * dpr);
        const targetH = Math.round(clientH * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
        }

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const imgAspect = imgW / imgH;
        const canvasAspect = canvas.width / canvas.height;

        let drawW, drawH, offsetPxX, offsetPxY;

        if (canvasAspect > imgAspect) {
            drawW = canvas.width;
            drawH = canvas.width / imgAspect;
            offsetPxX = 0;
            offsetPxY = (canvas.height - drawH) / 2;
        } else {
            drawH = canvas.height;
            drawW = canvas.height * imgAspect;
            offsetPxX = (canvas.width - drawW) / 2;
            offsetPxY = 0;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetPxX, offsetPxY, drawW, drawH);

        if (currentFrameNum) currentFrameNum.textContent = index;
        if (frameSlider && !frameSlider.dataset.userDragging) {
            frameSlider.value = index;
        }
    }

    // Calculate Target Frame based on scroll position across .hero-scroll-container
    function calculateTargetFrame() {
        if (isPlaying) return;

        const container = heroContainer || document.getElementById('experience');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const totalScrollable = rect.height - window.innerHeight;

        if (totalScrollable <= 0) return;

        let progress = -rect.top / totalScrollable;
        progress = Math.min(Math.max(progress, 0), 1);

        targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

        const percentEl = document.getElementById('scroll-percent-text');
        if (percentEl) percentEl.textContent = `${Math.round(progress * 100)}%`;

        updateOverlaysAndStory(progress);
    }

    // Dynamic Story Cards & Hero Title visibility based on scroll progress
    function updateOverlaysAndStory(progress) {
        const heroTitleOverlay = document.getElementById('hero-title-overlay');
        const storyContainer = document.getElementById('story-cards-container');
        const storyTag = document.getElementById('story-tag');
        const storyBadge = document.getElementById('story-badge');
        const storyTitle = document.getElementById('story-title');
        const storyDesc = document.getElementById('story-desc');

        // Hero Title visibility (Smoothly fades away from opacity 1 to 0 as user scrolls past 30%)
        if (heroTitleOverlay) {
            if (progress < 0.30) {
                const opacity = 1 - (progress / 0.30);
                heroTitleOverlay.style.opacity = opacity;
                heroTitleOverlay.style.transform = `translate(-50%, -50%) scale(${1 - progress * 0.15})`;
                heroTitleOverlay.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            } else {
                heroTitleOverlay.style.opacity = 0;
                heroTitleOverlay.style.pointerEvents = 'none';
            }
        }

        // Active Story Stage determination
        const activeStage = STORY_STAGES.find(stage => progress >= stage.start && progress < stage.end);

        if (activeStage && storyContainer) {
            if (storyTag) storyTag.textContent = activeStage.tag;
            if (storyBadge) storyBadge.textContent = activeStage.badge;
            if (storyTitle) storyTitle.textContent = activeStage.title;
            if (storyDesc) storyDesc.textContent = activeStage.desc;

            storyContainer.style.opacity = '1';
            storyContainer.style.transform = 'translateY(0)';
        } else if (storyContainer) {
            storyContainer.style.opacity = '0';
            storyContainer.style.transform = 'translateY(1rem)';
        }
    }

    // Interactive Controls Setup (Slider, Play/Pause, Sound FX)
    function setupInteractiveControls() {
        // Frame Range Slider Dragging
        if (frameSlider) {
            const handleSliderInput = () => {
                frameSlider.dataset.userDragging = "true";
                if (isPlaying) stopAutoPlay();
                const val = parseInt(frameSlider.value, 10);
                targetFrame = val;
                currentFrame = val;
                drawFrame(val);

                const progress = (val - 1) / (TOTAL_FRAMES - 1);
                const percentEl = document.getElementById('scroll-percent-text');
                if (percentEl) percentEl.textContent = `${Math.round(progress * 100)}%`;
                updateOverlaysAndStory(progress);
            };

            frameSlider.addEventListener('input', handleSliderInput);
            frameSlider.addEventListener('mousedown', () => frameSlider.dataset.userDragging = "true");
            frameSlider.addEventListener('touchstart', () => frameSlider.dataset.userDragging = "true");

            const endDrag = () => {
                delete frameSlider.dataset.userDragging;
            };
            frameSlider.addEventListener('mouseup', endDrag);
            frameSlider.addEventListener('touchend', endDrag);
            frameSlider.addEventListener('change', endDrag);
        }

        // Play / Pause Toggle Button
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (isPlaying) {
                    stopAutoPlay();
                } else {
                    startAutoPlay();
                }
            });
        }

        // Sound Sizzle Toggle Button
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', toggleSizzleSound);
        }
    }

    // Auto Playback logic
    function startAutoPlay() {
        isPlaying = true;
        const playIcon = document.getElementById('play-icon');
        if (playIcon) playIcon.className = 'fa-solid fa-pause';

        if (playInterval) clearInterval(playInterval);

        playInterval = setInterval(() => {
            if (targetFrame >= TOTAL_FRAMES) {
                targetFrame = 1;
                currentFrame = 1;
            } else {
                targetFrame += 1;
            }

            const progress = (targetFrame - 1) / (TOTAL_FRAMES - 1);
            const percentEl = document.getElementById('scroll-percent-text');
            if (percentEl) percentEl.textContent = `${Math.round(progress * 100)}%`;
            updateOverlaysAndStory(progress);
        }, 1000 / 30); // 30 FPS
    }

    function stopAutoPlay() {
        isPlaying = false;
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
        const playIcon = document.getElementById('play-icon');
        if (playIcon) playIcon.className = 'fa-solid fa-play';
    }

    // Web Audio API Synthesized Frying Sizzle Sound Effect
    let sizzleNode = null;
    let sizzleGain = null;

    function toggleSizzleSound() {
        const soundIcon = document.getElementById('sound-icon');
        isMuted = !isMuted;

        if (isMuted) {
            if (soundIcon) soundIcon.className = 'fa-solid fa-volume-xmark';
            if (sizzleGain) sizzleGain.gain.setValueAtTime(0, audioCtx.currentTime);
        } else {
            if (soundIcon) soundIcon.className = 'fa-solid fa-volume-high';
            initAudioSizzle();
            if (sizzleGain && audioCtx) {
                sizzleGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            }
        }
    }

    function initAudioSizzle() {
        if (audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Create 2-second white noise buffer
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            // Bandpass filter to simulate frying oil sizzle
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 1.2;

            sizzleGain = audioCtx.createGain();
            sizzleGain.gain.setValueAtTime(isMuted ? 0 : 0.15, audioCtx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(sizzleGain);
            sizzleGain.connect(audioCtx.destination);

            whiteNoise.start(0);
        } catch (e) {
            console.log('Web Audio API not supported or blocked:', e);
        }
    }

    // Smooth Lerp Render Loop (60FPS)
    let lastRenderedFrame = -1;
    function renderLoop() {
        calculateTargetFrame();

        const frameDiff = targetFrame - currentFrame;
        if (Math.abs(frameDiff) > 0.04) {
            currentFrame += frameDiff * 0.20;
            const frameToDraw = Math.round(currentFrame);
            if (frameToDraw !== lastRenderedFrame) {
                drawFrame(frameToDraw);
                lastRenderedFrame = frameToDraw;
            }
        }

        requestAnimationFrame(renderLoop);
    }

    /* ==========================================================================
       MENU TAB FILTERING & CART SYSTEM
       ========================================================================== */

    // Menu Category Tab Filter Handling
    document.addEventListener('DOMContentLoaded', () => {
        setupMenuTabs();
    });

    function setupMenuTabs() {
        const menuTabBtns = document.querySelectorAll('.menu-tab-btn');
        const menuItemCards = document.querySelectorAll('.menu-item-card');

        menuTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');

                menuTabBtns.forEach(b => {
                    b.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'text-on-surface', 'border', 'border-outline-variant');
                });
                btn.classList.add('active', 'bg-primary', 'text-white', 'shadow-md');
                btn.classList.remove('bg-white', 'text-on-surface', 'border', 'border-outline-variant');

                menuItemCards.forEach(card => {
                    const cat = card.getAttribute('data-cat');
                    if (category === 'all' || cat === category) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Delegated Add-To-Cart listener
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            if (name && !isNaN(price)) {
                addToCart({
                    id: Date.now(),
                    name: name,
                    details: "Freshly Cooked Order",
                    price: price,
                    qty: 1
                });
            }
        }
    });

    // Cart Management Functions
    function addToCart(item) {
        const existing = cart.find(i => i.name === item.name && i.details === item.details);
        if (existing) {
            existing.qty++;
        } else {
            cart.push(item);
        }

        updateCartUI();
        showToast(`Added "${item.name}" to cart! 🍗`);
    }

    function updateCartUI() {
        const cartCountEl = document.getElementById('cart-count');
        const cartContainer = document.getElementById('cart-items-container');
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        const cartDiscountEl = document.getElementById('cart-discount');
        const discountRow = document.getElementById('discount-row');
        const cartTotalEl = document.getElementById('cart-total');

        const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
        if (cartCountEl) cartCountEl.textContent = totalItems;

        if (!cartContainer) return;

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="text-center py-12 text-gray-400" id="empty-cart-msg">
                    <i class="fa-solid fa-drumstick-bite text-5xl mb-4 opacity-30 text-amber-500"></i>
                    <p>Your cart is empty.</p>
                    <p class="text-xs text-gray-500 mt-1">Add items from the menu to proceed!</p>
                </div>
            `;
            if (cartSubtotalEl) cartSubtotalEl.textContent = "₹0.00";
            if (cartTotalEl) cartTotalEl.textContent = "₹0.00";
            if (discountRow) discountRow.classList.add('hidden');
            return;
        }

        let subtotal = 0;
        let html = '';

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;

            html += `
                <div class="cart-item">
                    <div class="w-14 h-14 rounded-lg bg-amber-950/60 flex items-center justify-center text-3xl">
                        🍗
                    </div>
                    <div class="cart-item-info flex-1">
                        <h4>${item.name}</h4>
                        <p>${item.details}</p>
                        <div class="qty-price-row">
                            <div class="qty-picker">
                                <button class="qty-btn" onclick="window.updateCartQty(${index}, -1)">-</button>
                                <span>${item.qty}</span>
                                <button class="qty-btn" onclick="window.updateCartQty(${index}, 1)">+</button>
                            </div>
                            <span class="item-price">₹${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        cartContainer.innerHTML = html;

        let discount = isPromoApplied ? subtotal * 0.10 : 0;
        let total = subtotal - discount;

        if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        if (cartDiscountEl) cartDiscountEl.textContent = `-₹${discount.toFixed(2)}`;
        if (discountRow) {
            if (isPromoApplied) discountRow.classList.remove('hidden');
            else discountRow.classList.add('hidden');
        }
        if (cartTotalEl) cartTotalEl.textContent = `₹${total.toFixed(2)}`;
    }

    // Expose Qty update globally
    window.updateCartQty = function (index, change) {
        if (!cart[index]) return;
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    // Promo Code Handler
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-input');

    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', () => {
            const val = promoInput.value.trim().toUpperCase();
            if (val === 'CRISPY10') {
                isPromoApplied = true;
                updateCartUI();
                showToast("10% CRISPY10 Discount Applied! 🎉");
            } else {
                showToast("Invalid Promo Code. Try CRISPY10");
            }
        });
    }

    // Checkout Button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast("Your cart is empty!");
                return;
            }
            showToast("Order placed successfully! Preparing your food in Buxi Bazaar... 🍗🔥");
            cart = [];
            isPromoApplied = false;
            if (promoInput) promoInput.value = '';
            updateCartUI();
            setTimeout(() => {
                const cartModal = document.getElementById('cart-modal');
                if (cartModal) cartModal.classList.remove('active');
            }, 1200);
        });
    }

    // Cart Modal Controls
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartModal = document.getElementById('cart-modal');

    if (openCartBtn && cartModal) {
        openCartBtn.addEventListener('click', () => {
            cartModal.classList.add('active');
        });
    }
    if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });
    }

    // Toast Notification helper
    function showToast(msg) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        if (!toast || !toastMsg) return;

        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Navbar Mobile Menu, Dynamic Scroll Styling & Smooth Section Navigation
    function setupNavbarNavigation() {
        const transparentNavbar = document.querySelector('.transparent-navbar');
        const heroSection = document.getElementById('experience') || document.querySelector('.hero-scroll-container');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');

        // Dynamic Navbar scroll listener: switches to frosted white translucent glass over light background sections
        const updateNavbarStyle = () => {
            if (!transparentNavbar) return;
            let isOverLightSection = false;

            if (heroSection) {
                const rect = heroSection.getBoundingClientRect();
                // When bottom of hero section scroll container passes above navbar height (80px)
                if (rect.bottom <= 80) {
                    isOverLightSection = true;
                }
            } else {
                isOverLightSection = window.scrollY > 600;
            }

            if (isOverLightSection) {
                transparentNavbar.classList.add('scrolled-light');
            } else {
                transparentNavbar.classList.remove('scrolled-light');
            }
        };

        window.addEventListener('scroll', updateNavbarStyle);
        updateNavbarStyle();

        // Mobile Menu Toggle
        if (mobileMenuBtn && mobileMenuDropdown) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuDropdown.classList.toggle('hidden');
            });
        }

        // Smooth Anchor Navigation for all section links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                        if (mobileMenuDropdown) {
                            mobileMenuDropdown.classList.add('hidden');
                        }
                    }
                }
            });
        });
    }

    window.addEventListener('resize', resizeCanvas);
    preloadFrames();

    // Setup tab listeners if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setupMenuTabs();
        setupNavbarNavigation();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setupMenuTabs();
            setupNavbarNavigation();
        });
    }

})();
