// 导航栏滚动效果
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('py-2', 'shadow');
    navbar.classList.remove('py-4');
  } else {
    navbar.classList.add('py-4');
    navbar.classList.remove('py-2', 'shadow');
  }
});

// 移动端菜单
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  if (mobileMenu.classList.contains('hidden')) {
    menuBtn.innerHTML = '<i class="fa fa-bars text-2xl"></i>';
  } else {
    menuBtn.innerHTML = '<i class="fa fa-times text-2xl"></i>';
  }
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    // 关闭移动菜单（如果打开）
    if (!mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      menuBtn.innerHTML = '<i class="fa fa-bars text-2xl"></i>';
    }
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  });
});

// 表单提交验证
const submitForm = document.getElementById('consultForm');
if (submitForm) {
    submitForm.addEventListener('submit', (e) => {
        const agreementCheckbox = document.getElementById('agreement');
        if (!agreementCheckbox.checked) {
            e.preventDefault();
            alert('请先阅读并同意隐私协议');
            return false;
        }
        return true;
    });
}

// 返回顶部按钮
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTopBtn.classList.remove('opacity-0', 'invisible');
    backToTopBtn.classList.add('opacity-100', 'visible');
  } else {
    backToTopBtn.classList.add('opacity-0', 'invisible');
    backToTopBtn.classList.remove('opacity-100', 'visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// 数字计数器动画
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// 检测元素是否在视口中
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0
  );
}

// 滚动时触发计数器动画
let countersAnimated = false;
// 使用IntersectionObserver替代scroll事件监听
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !countersAnimated) {
      animateCounter(document.getElementById('counter1'), 200);
      animateCounter(document.getElementById('counter2'), 150);
      animateCounter(document.getElementById('counter3'), 50);
      animateCounter(document.getElementById('counter4'), 8);
      countersAnimated = true;
      counterObserver.disconnect(); // 动画触发后停止观察
    }
  });
}, { threshold: 0.1 });

// 观察计数器容器元素
const counterElement = document.getElementById('counter1');
if (counterElement && counterElement.parentElement) {
  counterObserver.observe(counterElement.parentElement);
}

// 客户评价轮播
const track = document.querySelector('.testimonial-track');
const prevBtn = document.querySelector('.testimonial-prev');
const nextBtn = document.querySelector('.testimonial-next');
const dots = document.querySelectorAll('.testimonial-dots button');
let currentIndex = 0;
const itemWidth = 100; // 百分比
const testimonialItems = document.querySelectorAll('.testimonial-item');
const totalItems = testimonialItems.length;

// 检查轮播元素是否存在
if (!track || !prevBtn || !nextBtn || dots.length === 0 || totalItems === 0) {
  console.warn('轮播元素未完全加载，轮播功能已禁用');
}

// 根据屏幕尺寸确定一次显示的项目数量
function getVisibleItems() {
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
}

function updateSlider() {
  const visibleItems = getVisibleItems();
  const maxIndex = totalItems - visibleItems;
  currentIndex = Math.min(currentIndex, maxIndex);
  currentIndex = Math.max(currentIndex, 0); // 添加边界检查
  
  const translateValue = -currentIndex * (itemWidth / visibleItems);
  track.style.transform = `translateX(${translateValue}%)`;
  track.style.transition = 'transform 0.5s ease'; // 显式添加过渡效果
  
  // 更新指示器
  dots.forEach((dot, index) => {
    if (index === currentIndex) {
      dot.classList.add('bg-primary');
      dot.classList.remove('bg-gray-300');
    } else {
      dot.classList.add('bg-gray-300');
      dot.classList.remove('bg-primary');
    }
  });
}

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateSlider();
  }
});

nextBtn.addEventListener('click', () => {
  const visibleItems = getVisibleItems();
  if (currentIndex < totalItems - visibleItems) {
    currentIndex++;
    updateSlider();
  }
});

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    currentIndex = index;
    updateSlider();
  });
});

// 添加窗口大小变化防抖处理
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateSlider();
  }, 250); // 延迟250ms执行，避免频繁触发
});

// 自动轮播
let autoSlideInterval;
function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    const visibleItems = getVisibleItems();
    if (currentIndex < totalItems - visibleItems) {
      currentIndex++;
    } else {
      currentIndex = 0; // 回到第一张
    }
    updateSlider();
  }, 5000); // 每5秒切换一次
}

// 鼠标悬停时暂停轮播
track.addEventListener('mouseenter', () => {
  clearInterval(autoSlideInterval);
});

// 鼠标离开时恢复轮播
track.addEventListener('mouseleave', () => {
  startAutoSlide();
});

// 初始化自动轮播
startAutoSlide();

// 案例筛选
const caseFilters = document.querySelectorAll('.case-filter');
const caseItems = document.querySelectorAll('.case-item');

caseFilters.forEach(filter => {
  filter.addEventListener('click', () => {
    // 更新按钮样式
    caseFilters.forEach(btn => {
      btn.classList.remove('active', 'bg-primary', 'text-white');
      btn.classList.add('bg-gray-100');
    });
    filter.classList.add('active', 'bg-primary', 'text-white');
    filter.classList.remove('bg-gray-100');
    
    const category = filter.textContent.trim();
    
    // 筛选案例
    caseItems.forEach(item => {
      if (category === '全部案例' || item.querySelector('.rounded-full').textContent.trim() === category) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// 表单提交处理
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nameInput = contactForm.querySelector('input[name="name"]');
  const phoneInput = contactForm.querySelector('input[name="phone"]');
  const emailInput = contactForm.querySelector('input[name="email"]');
  const messageInput = contactForm.querySelector('textarea[name="message"]');

  // 检查所有必填字段
  if (!nameInput || !phoneInput || !emailInput || !messageInput) {
    alert('表单元素加载错误，请刷新页面重试');
    return;
  }

  if (!nameInput.value.trim()) {
    alert('请填写您的姓名');
    nameInput.focus();
    return;
  }

  // 电话号码验证
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phoneInput.value.trim())) {
    alert('请输入有效的手机号码');
    phoneInput.focus();
    return;
  }

  if (!emailInput.value.trim()) {
    alert('请填写您的邮箱地址');
    emailInput.focus();
    return;
  }

  if (!isValidEmail(emailInput.value.trim())) {
    alert('请输入有效的邮箱地址');
    emailInput.focus();
    return;
  }

  if (!messageInput.value.trim()) {
    alert('请填写咨询内容');
    messageInput.focus();
    return;
  }
  
  // 防止重复提交
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';
  
  // 构建表单数据
  const formData = new FormData(contactForm);
  const data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    company: formData.get('company'),
    service: formData.get('service'),
    message: formData.get('message'),
    agreement: formData.get('privacy') === 'on'
  };

  // 调用后端接口
  fetch('https://api.wanyudegao.com/submit-to-dingtalk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(async response => {
    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('接口不支持 POST 方法，请检查后端配置');
      }
      throw new Error(`HTTP 错误! 状态码: ${response.status},您可能在重复提交请稍后再试！`);
    }
    try {
      return await response.json();
    } catch (error) {
      throw new Error('无效的 JSON 响应: ' + error.message);
    }
  })
  .then(result => {
    if (result.success) {
      // 显示提交成功消息
      const formContent = contactForm.innerHTML;
      contactForm.innerHTML = `
        <div class="text-center py-8">
          <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-500 mx-auto mb-6">
            <i class="fa fa-check text-3xl"></i>
          </div>
          <h3 class="text-2xl font-bold mb-2">提交成功！</h3>
          <p class="text-gray-500 mb-6">感谢您的咨询，我们的顾问将尽快与您联系。</p>
          <button id="resetForm" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors">
            返回表单
          </button>
        </div>
      `;
      
      // 重置表单按钮
      document.getElementById('resetForm').addEventListener('click', () => {
        contactForm.innerHTML = formContent;
        contactForm.reset();
      });
    } else {
      alert('提交失败，请稍后重试');
    }
    
    // 恢复提交按钮状态
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
  })
  .catch(error => {
    console.error('Error:', error);
    alert(`提交失败: ${error.message}`);
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
    
    // 调试信息
    console.log('请求URL:', '/submit');
    console.log('请求数据:', data);
    console.log('请求配置:', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  });
});

// 添加邮箱验证函数
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
