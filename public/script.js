// Document ready function to ensure all code runs after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS (Animate on Scroll) with optimized settings
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      disable: window.innerWidth < 768 ? true : false // Disable on mobile for better performance
    });
  }

  // Initialize Particles.js with responsive settings
  initParticles();
  
  // Initialize burger menu functionality
  initBurgerMenu();
  
  // Initialize banner slider
  initBannerSlider();
  
  // Initialize fade-in animations for content
  initFadeAnimations();
  
  // Initialize article modal functionality
  initArticleModals();
  
  // Save scroll position between page refreshes
  initScrollPositionSaving();
});

// Initialize Particles.js with responsive configuration
function initParticles() {
  if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
    // Adjust particle count based on screen size for better performance
    const particleCount = window.innerWidth < 768 ? 30 : 80;
    
    particlesJS('particles-js', {
      "particles": {
        "number": { 
          "value": particleCount,
          "density": {
            "enable": true,
            "value_area": 800
          }
        },
        "color": { "value": "#f5e1e9" },
        "shape": { "type": "circle" },
        "opacity": { 
          "value": 0.5,
          "random": false
        },
        "size": { 
          "value": 3,
          "random": true 
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#38465f",
          "opacity": 0.4,
          "width": 1
        },
        "move": { 
          "enable": true, 
          "speed": window.innerWidth < 768 ? 1.5 : 2.5, // Slower on mobile
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": { 
          "onhover": { 
            "enable": true, 
            "mode": "grab" 
          },
          "onclick": {
            "enable": true,
            "mode": "push"
          },
          "resize": true
        },
        "modes": { 
          "grab": { 
            "distance": 140, 
            "line_linked": { "opacity": 1 } 
          }
        }
      },
      "retina_detect": true
    });
  }
}

// Responsive burger menu implementation
function initBurgerMenu() {
  const burgerMenu = document.querySelector('.burger-menu');
  let sidebar = document.querySelector('.sidebar');
  let overlay = document.querySelector('.overlay');
  
  // Create sidebar if it doesn't exist
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-nav">
        <a href="#main-banner">ГЛАВНАЯ</a>
        <a href="#salons">САЛОНЫ</a>
        <a href="#articles">СТАТЬИ</a>
        <a href="#contacts">КОНТАКТЫ</a>
      </div>
    `;
    document.body.appendChild(sidebar);
  }
  
  // Create overlay if it doesn't exist
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }
  
  if (burgerMenu) {
    // Toggle menu function
    function toggleMenu() {
      burgerMenu.classList.toggle('active');
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Lock scrolling when menu is open
      document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
      
      // Add touch events for mobile
      if (sidebar.classList.contains('active')) {
        document.addEventListener('touchmove', preventScroll, { passive: false });
      } else {
        document.removeEventListener('touchmove', preventScroll);
      }
    }
    
    // Prevent scroll function for touch devices
    function preventScroll(e) {
      if (!sidebar.contains(e.target)) {
        e.preventDefault();
      }
    }
    
    // Event listeners
    burgerMenu.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    
    // Add touch event for mobile swipe to close
    let touchStartX = 0;
    sidebar.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    sidebar.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].clientX;
      // If swiped left
      if (touchStartX - touchEndX > 50 && sidebar.classList.contains('active')) {
        toggleMenu();
      }
    }, { passive: true });
    
    // Close menu when clicking links
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', toggleMenu);
    });
  }
}

// Banner slider with responsive timing and controls
function initBannerSlider() {
  const slides = document.querySelectorAll(".banner-slide");
  
  if (slides.length > 0) {
    let slideIndex = 0;
    let slideshowPaused = false;
    let slideshowInterval;
    
    // Show current slide
    function showSlide(index) {
      // First hide all slides
      slides.forEach(slide => {
        slide.style.opacity = "0";
        slide.style.display = "none";
      });
      
      // Then show the current slide
      slides[index].style.display = "block";
      setTimeout(() => {
        slides[index].style.opacity = "1";
      }, 50);
      
      // Update current slideIndex
      slideIndex = index;
    }
    
    // Function to show next slide
    function nextSlide() {
      if (!slideshowPaused) {
        let newIndex = (slideIndex + 1) % slides.length;
        showSlide(newIndex);
      }
    }
    
    // Function to handle manual navigation
    function moveSlide(step) {
      clearInterval(slideshowInterval);
      let newIndex = slideIndex + step;
      
      if (newIndex < 0) {
        newIndex = slides.length - 1;
      } else if (newIndex >= slides.length) {
        newIndex = 0;
      }
      
      showSlide(newIndex);
      
      // Restart the timer
      startSlideshow();
    }
    
    // Start slideshow with appropriate interval
    function startSlideshow() {
      // Clear any existing interval
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
      
      // Set interval - shorter on mobile for better engagement
      const slideDuration = window.innerWidth < 768 ? 4000 : 5000;
      slideshowInterval = setInterval(nextSlide, slideDuration);
    }
    
    // Initialize banner navigation buttons if they exist
    const prevButton = document.querySelector('.banner-prev');
    const nextButton = document.querySelector('.banner-next');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => moveSlide(-1));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => moveSlide(1));
    }
    
    // Touch swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const bannerContainer = document.querySelector('.banner-container') || document.querySelector('.banner-wrapper');
    
    if (bannerContainer) {
      // Touch events for mobile swipe
      bannerContainer.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      
      bannerContainer.addEventListener('touchmove', e => {
        touchEndX = e.touches[0].clientX;
      }, { passive: true });
      
      bannerContainer.addEventListener('touchend', () => {
        const swipeDistance = touchStartX - touchEndX;
        
        // Minimum distance to be considered a deliberate swipe
        if (Math.abs(swipeDistance) > 50) {
          if (swipeDistance > 0) {
            // Swiped left - go to next slide
            moveSlide(1);
          } else {
            // Swiped right - go to previous slide
            moveSlide(-1);
          }
        }
      }, { passive: true });
      
      // Pause slideshow when user interacts with the banner
      bannerContainer.addEventListener('mouseenter', () => {
        slideshowPaused = true;
      });
      
      bannerContainer.addEventListener('mouseleave', () => {
        slideshowPaused = false;
      });
    }
    
    // Show first slide and start slideshow
    showSlide(0);
    startSlideshow();
    
    // Adjust slideshow settings on window resize
    window.addEventListener('resize', () => {
      startSlideshow(); // Restart with appropriate timing for the new screen size
    });
    
    // Export moveSlide function to global scope for use in HTML
    window.moveSlide = moveSlide;
  }
}

// Fade-in animations for page elements
function initFadeAnimations() {
  const fadeItems = document.querySelectorAll('.fade-item');
  
  if (fadeItems.length > 0) {
    // Adjust timing based on device
    const baseDelay = window.innerWidth < 768 ? 150 : 300;
    
    fadeItems.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, index * baseDelay);
    });
  }
  
  // Initialize container visibility if necessary
  const container = document.querySelector('.container');
  if (container && container.classList.contains('hidden')) {
    setTimeout(() => {
      container.classList.remove('hidden');
      container.classList.add('visible');
    }, 100);
  }
}

// Article modal functionality
function initArticleModals() {
  // Consolidated article data
  const articleData = {
    1: {
      title: "Секреты здоровых волос",
      text: "Здоровые волосы — это не просто красота, а результат регулярного и грамотного ухода. В первую очередь, важно правильно подобрать шампунь и бальзам, подходящие по типу волос. Избегайте средств с агрессивными сульфатами и отдавайте предпочтение натуральным ингредиентам. Ограничьте использование фена, плоек и утюжков — высокие температуры повреждают структуру волос. Если без укладки не обойтись, всегда наносите термозащиту. Регулярное подравнивание кончиков раз в 6–8 недель поможет избежать сечения. Не забывайте про питание волос изнутри — включайте в рацион продукты, богатые витаминами A, E, C, а также биотином и цинком. Также полезны маски и масла: кокосовое, аргановое, репейное. Они укрепляют волосы, придают им блеск и эластичность. Раз в неделю делайте глубокое увлажнение: нанесите питательную маску под тёплое полотенце на 30–40 минут. Это особенно важно в холодное время года, когда волосы быстро теряют влагу. И помните: каждое прикосновение — это забота. Расчесывайте волосы аккуратно, начиная с кончиков, и выбирайте щётки с натуральной щетиной."
    },
    2: {
      title: "Как выбрать идеальный маникюр",
      text: "Идеальный маникюр — это тот, который подчёркивает индивидуальность и гармонирует с образом. Выбор формы ногтей зависит от формы рук и пальцев. Например, овальная форма удлиняет пальцы, а квадратная придаёт стильный акцент. Тренды — важны, но не первостепенны. Лучше опираться на то, что подходит именно вам. Светлые и нюдовые оттенки — универсальны, они подойдут для офиса и повседневной носки. Яркие цвета и дизайн — отличное решение для праздников и особых случаев. Не менее важен уход. Регулярное увлажнение кутикулы маслом, использование антисептика после каждого визита в салон и защита от бытовой химии — обязательны для здоровья ногтей. Кстати, перерывы между покрытиями тоже нужны — дайте ногтям подышать. Обратите внимание на модные техники: градиент (омбре), френч с цветной линией, зеркальный блеск, текстуры под мрамор или кошачий глаз. Можно добавить стразы, геометрию или минималистичные линии — важно соблюдать баланс и аккуратность. Хороший мастер — это половина успеха. Он поможет подобрать цвет, форму и учтёт особенности ногтевой пластины. Не бойтесь экспериментировать, но всегда доверяйте своему стилю и ощущениям."
    },
    3: {
      title: "Польза массажа для здоровья",
      text: "Массаж — это не просто приятная процедура, а целый ритуал восстановления и расслабления. Он активизирует лимфо- и кровообращение, улучшает питание тканей, способствует выводу токсинов из организма. Благодаря этому кожа становится более упругой, а мышцы — эластичными. Существует множество техник массажа: классический, лимфодренажный, спортивный, антицеллюлитный и расслабляющий. Каждый из них оказывает своё воздействие — от глубокого мышечного восстановления до общего расслабления и улучшения сна. Регулярные сеансы помогают справиться со стрессом, хронической усталостью и даже мигренями. Во время массажа вырабатываются эндорфины — гормоны счастья, которые улучшают настроение и способствуют эмоциональному восстановлению. Для здоровья спины особенно полезен массаж шейно-воротниковой зоны. Он снимает напряжение от сидячей работы, избавляет от головной боли и восстанавливает подвижность мышц. Даже 30 минут массажа в неделю могут улучшить качество жизни. Главное — выбирать опытного специалиста, который учитывает ваши индивидуальные особенности и пожелания. Массаж — это не роскошь, а важный элемент заботы о себе."
    },
    4: {
      title: "Правильный уход за кожей лица",
      text: "Правильный уход за кожей лица начинается с понимания её индивидуальных особенностей. Каждому типу кожи — сухой, жирной, комбинированной или чувствительной — требуется особенный подход, и универсальных решений не существует. Главное правило ухода — регулярность. Утром и вечером необходимо очищать кожу мягким средством, подходящим по типу, избегая агрессивных компонентов, нарушающих защитный барьер. После очищения важно использовать тоник, чтобы восстановить уровень pH и подготовить кожу к последующим этапам. Далее — увлажнение. Даже жирной коже необходима влага, просто подбираются лёгкие текстуры. Одним из главных этапов является защита от ультрафиолета. Солнцезащитный крем должен стать привычкой каждый день, независимо от времени года и погоды. Регулярный пилинг раз в неделю помогает избавиться от ороговевших клеток, делая кожу гладкой и сияющей, но злоупотреблять им не стоит. Избыток активных компонентов — ретинола, кислот или скрабов — может навредить коже, вызвать раздражения и шелушения. Уход должен быть продуманным, базироваться на наблюдениях за реакцией кожи, и со временем каждая женщина может создать собственную эффективную бьюти-рутину, приносящую видимые результаты. Важно слушать себя и не поддаваться маркетингу: не количество средств делает кожу здоровой, а их грамотное применение и стабильность."
    },
    5: {
      title: "Тренды в мире макияжа 2025",
      text: "Весна 2025 принесла в мир макияжа новую волну вдохновения, сделав акцент на сиянии, мягкости и свободе самовыражения. Главный тренд — естественная кожа с эффектом glow skin, то есть светящейся изнутри. Вместо плотных тональных основ используются лёгкие кремы с влажным финишем, а хайлайтеры — деликатные и едва заметные. Всё внимание — к глазам. Яркие стрелки насыщенных оттенков, таких как бирюза, лиловый и коралл, добавляют образу дерзости, но остаются стильными. Используются кремовые тени с блестящим, мокрым финишем, придающим взгляду глубину. Вместо чёткого контуринга в моду возвращаются румяна: кремовые, полупрозрачные, нанесённые на яблочки щёк и растушёванные до легкой вуали. Губы оформляются максимально естественно — блески и тинты нежных оттенков, как будто это просто ухоженные губы без косметики. Особое внимание уделяется бровям: они становятся чуть более пушистыми, натуральными по форме, подчёркивая индивидуальность. В макияже 2025 царит свобода: можно сочетать несовместимое, играть с цветами, экспериментировать, главное — чувствовать себя комфортно и уверенно. Этот сезон вдохновляет быть собой и проявлять внутреннее сияние через образ."
    },
    6: {
      title: "Ароматерапия и её влияние на настроение",
      text: "Ароматерапия — это не просто модный тренд, а древняя практика, проверенная временем и поддержанная современными исследованиями. Эфирные масла, вдыхая которые человек ощущает прилив энергии или расслабление, действуют на глубинные участки мозга, влияя на настроение, самочувствие и даже поведение. Наше обоняние напрямую связано с лимбической системой, которая управляет эмоциями и памятью, поэтому один аромат может мгновенно перенести в состояние покоя или, наоборот, бодрости. Масло лаванды, например, помогает при стрессе, снижает уровень тревожности и способствует качественному сну. Масло мяты активизирует умственную деятельность, освежает восприятие, повышает концентрацию. Апельсиновое масло отлично поднимает настроение, заряжает позитивом и может даже облегчать симптомы лёгкой депрессии. Иланг-иланг помогает расслабиться, гармонизирует эмоциональный фон, особенно полезен после напряжённого дня. Эфирные масла можно использовать в аромалампах, диффузорах, добавлять в ванну или массажные средства, а также нанести одну каплю на подушку перед сном. Главное — использовать качественные натуральные масла и соблюдать меры предосторожности, так как некоторые могут вызывать аллергическую реакцию. Ароматерапия становится настоящим искусством: подбор композиции под настроение, ритуал вдыхания, ощущение спокойствия — всё это помогает вернуться к себе, наладить внутренний баланс и заботиться не только о теле, но и о душе."
    }
  };
  
  // Open article modal function - make it globally accessible
  window.openArticle = function(id) {
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    
    // Check if modal elements exist
    if (!modal || !modalTitle || !modalText) {
      console.error('Modal elements not found');
      return;
    }
    
    if (articleData[id]) {
      modalTitle.textContent = articleData[id].title;
      modalText.textContent = articleData[id].text;
      
      modal.classList.remove('hidden');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      
      // For mobile, add the ability to close with a tap outside or swipe
      if (window.innerWidth < 768) {
        const modalDialog = modal.querySelector('.modal-dialog') || modal.querySelector('.modal-content');
        if (modalDialog) {
          modalDialog.style.maxHeight = '80vh';
          modalDialog.style.overflowY = 'auto';
        }
      }
    }
  };
  
  // Close article modal function - make it globally accessible
  window.closeArticle = function() {
    const modal = document.getElementById('articleModal');
    if (modal) {
      modal.classList.remove('show');
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  };
  
  // Add event listeners for the modal if it exists
  const modal = document.getElementById('articleModal');
  if (modal) {
    // Close when clicking outside the modal content
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        window.closeArticle();
      }
    });
    
    // Add keyboard support (Escape to close)
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.classList.contains('show')) {
        window.closeArticle();
      }
    });
    
    // Add swipe to close for mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    modal.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    modal.addEventListener('touchend', function(e) {
      touchEndY = e.changedTouches[0].clientY;
      // If swiped down
      if (touchEndY - touchStartY > 70) {
        window.closeArticle();
      }
    }, { passive: true });
  }
}

// Save and restore scroll position between page refreshes
function initScrollPositionSaving() {
  // Restore scroll position on page load
  if (sessionStorage.scrollPosition) {
    window.scrollTo(0, parseInt(sessionStorage.scrollPosition));
  }
  
  // Save scroll position before page unload
  window.addEventListener('beforeunload', function() {
    sessionStorage.scrollPosition = window.scrollY.toString();
  });
  
  // For mobile devices, handle orientation change
  window.addEventListener('orientationchange', function() {
    // Wait for the orientation change to complete
    setTimeout(function() {
      if (sessionStorage.scrollPosition) {
        window.scrollTo(0, parseInt(sessionStorage.scrollPosition));
      }
    }, 300);
  });
}

// Responsive utility function - can be used throughout the code
function isLowPerfDevice() {
  // Check if device is low performance (mobile, older device, etc.)
  const isLowPerf = 
    window.innerWidth < 768 || 
    navigator.hardwareConcurrency < 4 || 
    navigator.deviceMemory < 4 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return isLowPerf;
}

// For SSR or if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(function() {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }, 1);
}