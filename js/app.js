/* Source UI app logic - extracted from index.html */
// ==================== 性能优化工具函数 ====================

// 节流函数：限制函数执行频率（适用于 scroll, resize, mousemove 等高频事件）
function throttle(func, wait) {
  let timeout = null;
  let previous = 0;
  return function(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

// 防抖函数：延迟执行，只执行最后一次（适用于 input, search 等）
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// requestAnimationFrame 节流（最适合动画相关的高频事件）
function rafThrottle(func) {
  let rafId = null;
  return function(...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
}

// DOM 查询缓存
const domCache = new Map();
function getCachedElement(selector) {
  if (!domCache.has(selector)) {
    domCache.set(selector, document.querySelector(selector));
  }
  return domCache.get(selector);
}

// 批量 DOM 更新（减少重排）
function batchDOMUpdate(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// 运行时性能模式：自动识别省流量/低内存设备，也支持 localStorage.powerSaving 手动开启。
function initRuntimePerformanceMode() {
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const lowMemory = !!(navigator.deviceMemory && navigator.deviceMemory <= 4);
  const manualPowerSaving = localStorage.getItem('powerSaving') === 'true';
  const powerSaving = saveData || lowMemory || manualPowerSaving;

  document.body.classList.toggle('power-saving', powerSaving);
  document.body.classList.toggle('low-performance', powerSaving);

  if (powerSaving) {
    // 省电模式下优先降低 GPU 层和昂贵模糊材质。
    document.body.classList.remove('gpu-accelerated', 'advanced-materials');
  }

  return powerSaving;
}

function isVisualEffectsEnabled() {
  return document.body.classList.contains('advanced-materials') &&
    !document.body.classList.contains('power-saving') &&
    !document.body.classList.contains('low-performance');
}

// ==================== 全局变量 ====================
let lock, desktop;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM加载完成');
  
  // 设置随机背景图（使用 random.js API）
  setTimeout(function() {
    if (typeof getRandomPicV === 'function') {
      const bgUrl = getRandomPicV();
      const bgElements = ['lock', 'desktop', 'viewfinder'];
      bgElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.backgroundImage = `url('${bgUrl}')`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
      });
      // 相册按钮
      const albumBtn = document.querySelector('.camera-album-btn');
      if (albumBtn) {
        albumBtn.style.backgroundImage = `url('${bgUrl}')`;
        albumBtn.style.backgroundSize = 'cover';
        albumBtn.style.backgroundPosition = 'center';
      }
      console.log('随机背景已设置:', bgUrl);
    }
  }, 100);
  
  // 禁用右键菜单
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  // 初始化运行时性能模式
  const runtimePowerSaving = initRuntimePerformanceMode();

  // 初始化GPU硬件加速设置：省电模式下默认关闭，避免长时间占用合成层。
  const gpuAccelerationEnabled = !runtimePowerSaving && localStorage.getItem('gpuAcceleration') !== 'false';
  if (gpuAccelerationEnabled) {
    document.body.classList.add('gpu-accelerated');
    console.log('[GPU] Hardware acceleration enabled');
  } else {
    document.body.classList.remove('gpu-accelerated');
    console.log('[GPU] Hardware acceleration disabled');
  }
  
  // 初始化高级材质设置：省电模式下默认关闭重模糊。
  const advancedMaterialsEnabled = !runtimePowerSaving && localStorage.getItem('advancedMaterials') !== 'false';
  if (advancedMaterialsEnabled) {
    document.body.classList.add('advanced-materials');
    console.log('[Materials] Advanced materials enabled');
  } else {
    document.body.classList.remove('advanced-materials');
    console.log('[Materials] Advanced materials disabled');
  }
  
  // 开机动画控制 - 支持跳过
  const bootScreen = document.getElementById('boot-screen');
  const bootSkipEnabled = localStorage.getItem('bootSkip') !== 'false';
  if (bootScreen) {
    if (bootSkipEnabled) {
      bootScreen.style.display = 'none';
      console.log('开机动画已跳过');
    } else {
      setTimeout(function() {
        bootScreen.classList.add('hidden');
        console.log('开机动画结束');
      }, 4000);
    }
  }
  
  // 获取元素
  lock = document.getElementById('lock');
  desktop = document.getElementById('desktop');
  const swipeArea = document.getElementById('swipe-area');
  
  console.log('获取元素:', lock, desktop, swipeArea);
  
  // 滑动变量
  let startY = 0;
  let isSwiping = false;
  
  // 解锁函数
  function unlock() {
    console.log('解锁函数被调用');
    
    if (lock && desktop) {
      console.log('开始解锁过程');
      
      // 添加解锁动画
      lock.style.transition = 'all 0.5s ease';
      lock.style.opacity = '0';
      lock.style.transform = 'translateY(-50px) scale(0.92)';
      
      // 显示桌面
      desktop.classList.add('show');
      
      // 1秒后隐藏锁定屏幕
      setTimeout(() => {
        lock.style.display = 'none';
        console.log('解锁完成');
      }, 1000);
    }
  }
  
  // 鼠标事件
  if (swipeArea) {
    console.log('添加鼠标事件监听器');
    
    swipeArea.addEventListener('mousedown', function(e) {
      console.log('鼠标按下:', e.clientY);
      startY = e.clientY;
      isSwiping = true;
    });
    
    swipeArea.addEventListener('mouseup', function(e) {
      console.log('鼠标释放:', e.clientY);
      if (isSwiping) {
        const diffY = startY - e.clientY;
        console.log('计算滑动距离:', diffY);
        if (diffY > 50) {
          console.log('滑动距离满足条件，解锁');
          unlock();
        }
        isSwiping = false;
      }
    });
    
    // 触摸事件
    swipeArea.addEventListener('touchstart', function(e) {
      console.log('触摸开始:', e.touches[0].clientY);
      startY = e.touches[0].clientY;
      isSwiping = true;
    });
    
    swipeArea.addEventListener('touchend', function(e) {
      console.log('触摸结束:', e.changedTouches[0].clientY);
      if (isSwiping) {
        const diffY = startY - e.changedTouches[0].clientY;
        console.log('计算滑动距离:', diffY);
        if (diffY > 50) {
          console.log('滑动距离满足条件，解锁');
          unlock();
        }
        isSwiping = false;
      }
    });
  }
  
  // 为了测试，添加一个点击解锁功能（在swipe-area上）
  if (swipeArea) {
    swipeArea.addEventListener('click', function() {
      console.log('swipe-area被点击，直接解锁');
      unlock();
    });
  }

// 定义其他变量
const app = document.getElementById('app-window');
const blur = document.getElementById('blur');
const status = document.getElementById('status');
const pages = document.querySelectorAll('.page');
const subpages = document.querySelectorAll('.subpage');
const homeIndicator = document.getElementById('home-indicator');
const controlCenter = document.getElementById('control-center');
const statusTrigger = document.getElementById('status-trigger');
const controlCenterBg = document.getElementById('control-center-bg');

let currentIcon = null;
let currentPage = null;
let controlOpen = false;

let lockStartY = 0, lockStartX = 0, isLockDragging = false;

// 确保handleLockStart和handleLockEnd函数在全局范围内可用
window.handleLockStart = function(y, x) {
  console.log('handleLockStart被调用', y, x);
  if (desktop.classList.contains('show')) return;
  lockStartY = y; lockStartX = x; isLockDragging = true;
  console.log('isLockDragging设置为true');
};

window.handleLockEnd = function(y, x) {
  console.log('handleLockEnd被调用', y, x);
  if (!isLockDragging) return;
  isLockDragging = false;
  const diffY = lockStartY - y;
  const diffX = Math.abs(lockStartX - x);
  console.log('计算滑动距离:', diffY, diffX);
  // 允许向上滑动解锁
  if (diffY > 80 && diffX < 60) {
    console.log('滑动距离满足条件，调用window.unlockScreen');
    window.unlockScreen();
  }
};

// 完全重写解锁逻辑，使用最基本的JavaScript代码
window.unlockScreen = function() {
  // 直接获取元素，不依赖于外部变量
  const lockElement = document.getElementById('lock');
  const desktopElement = document.getElementById('desktop');
  
  console.log('解锁函数被调用');
  console.log('lock元素:', lockElement);
  console.log('desktop元素:', desktopElement);
  
  if (lockElement && desktopElement) {
    console.log('开始解锁过程');
    
    // 添加解锁动画类
    lockElement.classList.add('unlocking');
    
    // 显示桌面
    desktopElement.classList.add('show');
    
    // 600毫秒后隐藏锁定屏幕
    setTimeout(() => {
      lockElement.style.display = 'none';
      console.log('解锁完成');
    }, 600);
  } else {
    console.log('无法找到lock或desktop元素');
  }
}

const lockTimeElement = document.querySelector('.lock-time');
const statusTimeElement = document.querySelector('#status .time');
let timeUpdateTimer = null;

function updateTime() {
  const t = new Date();
  const h = String(t.getHours()).padStart(2, '0');
  const m = String(t.getMinutes()).padStart(2, '0');
  const timeText = h + ':' + m;
  if (lockTimeElement) lockTimeElement.innerText = timeText;
  if (statusTimeElement) statusTimeElement.innerText = timeText;
}

function scheduleTimeUpdate() {
  clearTimeout(timeUpdateTimer);
  if (document.hidden) return;

  updateTime();

  // 对齐到下一分钟再更新，避免每秒无意义刷新 DOM。
  const now = new Date();
  const delay = Math.max(1000, (60 - now.getSeconds()) * 1000 - now.getMilliseconds());
  timeUpdateTimer = setTimeout(scheduleTimeUpdate, delay);
}

scheduleTimeUpdate();

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    clearTimeout(timeUpdateTimer);
    if (fpsAnimationId) {
      cancelAnimationFrame(fpsAnimationId);
      fpsAnimationId = null;
    }
    stopNetworkLatencyMonitoring();
  } else {
    scheduleTimeUpdate();
    if (isFPSDisplayEnabled && !fpsAnimationId) {
      fpsLastTime = 0;
      fpsAnimationId = requestAnimationFrame(updateFPS);
    }
    if (isPerformanceMetricsEnabled) {
      startNetworkLatencyMonitoring();
    }
  }
});

function resetAllPages() {
  pages.forEach(page => page.classList.remove('show', 'slide-left'));
  // 重置所有子页面
  subpages.forEach(subpage => subpage.classList.remove('show'));
  currentPage = null;
  console.log('[FluidCloud] resetAllPages called, currentPage reset to null');
}

function openApp(appName, clickIcon) {
  if (app.classList.contains('show')) {
    closeApp();
    setTimeout(() => doOpenApp(appName, clickIcon), 300);
  } else {
    doOpenApp(appName, clickIcon);
  }
}

function doOpenApp(appName, clickIcon) {
  console.log('[App] doOpenApp called:', appName);
  resetAllPages();
  currentIcon = clickIcon;
  const rect = clickIcon.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  app.style.transformOrigin = cx + 'px ' + cy + 'px';
  
  const targetPage = document.getElementById('page-' + appName);
  console.log('[App] targetPage:', targetPage);
  if (!targetPage) {
    console.error('[App] Target page not found for:', appName);
    return;
  }

  currentPage = targetPage;
  currentPage.classList.add('show');
  console.log('[App] Showed page:', appName);

  // 添加壁纸缩放效果和应用显示
  desktop.classList.add('app-open');
  blur.classList.add('app-open');
  status.classList.add('hidden');
  blur.classList.add('active');
  
  // 应用从图标位置缩放的动画
  app.style.transform = 'scale(0)';
  app.style.opacity = '0';
  app.classList.add('show');
  
  // 强制重绘
  app.offsetHeight;
  
  // 开始缩放动画
  app.style.transition = 'transform 0.5s var(--ios-spring), opacity 0.3s var(--ios-smooth)';
  app.style.transform = 'scale(1)';
  app.style.opacity = '1';
  
  // 如果打开的是音乐应用，隐藏流体云
  if (appName === 'music' && fluidCloud) {
    fluidCloud.classList.add('in-music-app');
    console.log('[App] Added in-music-app class to fluid cloud');
  }
}

document.querySelectorAll('.icon-item[data-app]').forEach(icon => {
  icon.addEventListener('click', function() {
    openApp(this.getAttribute('data-app'), this);
  });
});

document.querySelectorAll('.dock-item[data-app]').forEach(icon => {
  icon.addEventListener('click', function() {
    openApp(this.getAttribute('data-app'), this);
  });
});

document.querySelectorAll('[data-subpage]').forEach(item => {
  item.addEventListener('click', function() {
    const subpageId = this.getAttribute('data-subpage');
    console.log('[Navigation] Opening subpage:', subpageId);
    const targetSubpage = document.getElementById('subpage-' + subpageId);
    if (!targetSubpage || !currentPage) return;
    currentPage.classList.add('slide-left');
    void targetSubpage.offsetWidth;
    targetSubpage.classList.add('show');

    // 如果是开发者选项页面，更新开关状态
    if (subpageId === 'setting-developer') {
      console.log('[Navigation] Developer page opened, updating switches');
      updateDeveloperSwitches();
    }
  });
});

function goBack() {
  if (!currentPage) return;
  subpages.forEach(subpage => subpage.classList.remove('show'));
  currentPage.classList.remove('slide-left');
}
window.goBack = goBack;

let appStartY = 0, appStartX = 0, isAppDragging = false;

function handleAppStart(y, x) {
  if (!app.classList.contains('show')) return;
  appStartY = y; appStartX = x; isAppDragging = true;
}

function handleAppEnd(y, x) {
  if (!isAppDragging) return;
  isAppDragging = false;
  if (!app.classList.contains('show')) return;
  const diffY = appStartY - y;
  const diffX = Math.abs(appStartX - x);
  if (diffY > 100 && diffX < 50) closeApp();
}

function closeApp() {
  console.log('[App] closeApp called, currentPage:', currentPage ? currentPage.id : null);
  
  // 如果全屏歌词正在显示，先隐藏它，等待动画完成后再关闭应用
  if (isFullscreenLyrics && fullscreenLyrics) {
    console.log('[App] Hiding fullscreen lyrics before closing app');
    toggleFullscreenLyrics();
    // 等待全屏歌词退出动画完成（300ms）后再执行应用关闭
    setTimeout(() => {
      performCloseApp();
    }, 350);
    return;
  }
  
  // 如果没有全屏歌词，直接关闭应用
  performCloseApp();
}

// 实际执行应用关闭的逻辑
function performCloseApp() {
  // 判断当前是否是音乐应用且正在播放
  const isMusicApp = currentPage && currentPage.id === 'page-music';
  const shouldReturnToFluidCloud = isMusicApp && musicPlaylist.length > 0 && currentMusicIndex >= 0;
  console.log('[App] isMusicApp:', isMusicApp, 'shouldReturnToFluidCloud:', shouldReturnToFluidCloud);
  
  let cx, cy;
  
  if (shouldReturnToFluidCloud) {
    // 如果是音乐应用，缩回到流体云位置（屏幕顶部中央）
    cx = window.innerWidth / 2;
    cy = 60; // 流体云大致位置
    console.log('[App] Closing to fluid cloud position:', cx, cy);
    
    // 恢复流体云显示
    if (fluidCloud) {
      fluidCloud.classList.remove('in-music-app');
      console.log('[App] Removed in-music-app class from fluid cloud');
    }
    
    // 给退出的应用界面添加模糊效果，同时恢复背景
    app.style.filter = 'blur(10px)';
    blur.classList.remove('active');
    desktop.classList.remove('app-open');
    blur.classList.remove('app-open');
    status.classList.remove('hidden');
    
    // 执行缩回动画
    app.style.transformOrigin = cx + 'px ' + cy + 'px';
    app.style.transition = 'transform 0.4s var(--ios-spring), opacity 0.3s var(--ios-smooth), filter 0.3s var(--ios-smooth)';
    app.style.transform = 'scale(0)';
    app.style.opacity = '0';
    
    setTimeout(() => {
      app.classList.remove('show');
      app.style.filter = '';
      resetAllPages();
      currentIcon = null;
      console.log('[App] App closed, returned to fluid cloud');
    }, 350);
  } else {
    // 普通关闭逻辑
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
    if (currentIcon) {
      const rect = currentIcon.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }
    console.log('[App] Normal close to icon position:', cx, cy);
    
    // 立即恢复模糊和缩放效果
    blur.classList.remove('active');
    desktop.classList.remove('app-open');
    blur.classList.remove('app-open');
    status.classList.remove('hidden');
    
    // 关闭应用时恢复流体云显示（如果正在播放音乐）
    if (fluidCloud) {
      fluidCloud.classList.remove('in-music-app');
    }
    
    // 执行缩回动画
    app.style.transformOrigin = cx + 'px ' + cy + 'px';
    app.style.transition = 'transform 0.4s var(--ios-spring), opacity 0.3s var(--ios-smooth)';
    app.style.transform = 'scale(0)';
    app.style.opacity = '0';
    
    setTimeout(() => {
      app.classList.remove('show');
      resetAllPages();
      currentIcon = null;
      console.log('[App] App closed normally');
    }, 350);
  }
}
window.closeApp = closeApp;
window.performCloseApp = performCloseApp;

document.addEventListener('touchstart', e => {
  if (app.classList.contains('show')) {
    handleAppStart(e.touches[0].clientY, e.touches[0].clientX);
  }
}, { passive: true });

document.addEventListener('touchend', e => {
  handleAppEnd(e.changedTouches[0].clientY, e.changedTouches[0].clientX);
});

document.addEventListener('mousedown', e => {
  if (app.classList.contains('show')) {
    handleAppStart(e.clientY, e.clientX);
  }
});

document.addEventListener('mouseup', e => {
  handleAppEnd(e.clientY, e.clientX);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && app.classList.contains('show')) {
    closeApp();
  }
});

if (homeIndicator) {
  homeIndicator.addEventListener('click', () => {
    if (app.classList.contains('show')) closeApp();
  });
}

document.querySelectorAll('.item-switch').forEach(switchEl => {
  // 跳过开发者选项中的开关，因为它们有自己的点击处理函数
  const parentItem = switchEl.closest('.item');
  if (parentItem && (
    parentItem.id === 'developer-debug-switch' ||
    parentItem.id === 'developer-fps-switch' ||
    parentItem.id === 'developer-performance-switch' ||
    parentItem.id === 'developer-boot-switch'
  )) {
    return; // 跳过这些开关
  }

  switchEl.addEventListener('click', (e) => {
    e.stopPropagation();
    switchEl.classList.toggle('active');
  });
});

const viewfinder = document.getElementById('viewfinder');
const focusBox = document.getElementById('focus-box');
const gridBtn = document.getElementById('grid-btn');
const gridLines = document.getElementById('grid-lines');
const captureBtn = document.getElementById('capture-btn');

if (viewfinder) {
  viewfinder.addEventListener('click', (e) => {
    const rect = viewfinder.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (focusBox) {
      focusBox.style.left = (x - 40) + 'px';
      focusBox.style.top = (y - 40) + 'px';
      focusBox.classList.remove('show');
      void focusBox.offsetWidth;
      focusBox.classList.add('show');
      setTimeout(() => focusBox.classList.remove('show'), 2000);
    }
  });
}

if (gridBtn && gridLines) {
  gridBtn.addEventListener('click', () => {
    gridBtn.classList.toggle('active');
    gridLines.classList.toggle('show');
  });
}

if (captureBtn && viewfinder) {
  captureBtn.addEventListener('click', () => {
    viewfinder.style.opacity = '0';
    setTimeout(() => viewfinder.style.opacity = '1', 100);
  });
}

document.querySelectorAll('.camera-mode').forEach(mode => {
  mode.addEventListener('click', () => {
    document.querySelectorAll('.camera-mode').forEach(m => m.classList.remove('active'));
    mode.classList.add('active');
  });
});

document.querySelectorAll('.camera-top-btn').forEach(btn => {
  if (btn.id !== 'grid-btn') {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  }
});

let touchStartY = 0;
let touchStartX = 0;
let isTouching = false;

document.addEventListener('touchstart', (e) => {
  if (controlOpen) return; // 如果控制中心已打开，则不响应
  const touch = e.touches[0];
  if (touch.clientY < 120) {
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    isTouching = true;
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isTouching || controlOpen) return;
  const touch = e.touches[0];
  const deltaY = touch.clientY - touchStartY;
  const deltaX = Math.abs(touch.clientX - touchStartX);
  
  if (deltaY > 30 && deltaX < 50) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!isTouching) return;
  const touch = e.changedTouches[0];
  const deltaY = touch.clientY - touchStartY;
  const deltaX = Math.abs(touch.clientX - touchStartX);
  
  if (deltaY > 80 && deltaX < 100 && !controlOpen) {
    openControlCenter();
  }
  isTouching = false;
}, { passive: true });

const controlHandle = document.getElementById('control-handle');

function openControlCenter() {
  controlCenter.classList.add('show');
  controlOpen = true;
  // 打开控制中心时隐藏流体云
  if (fluidCloud) {
    fluidCloud.classList.add('in-control-center');
  }
  
  // 设置控制中心背景效果：低性能/省电模式下避免昂贵 backdrop-filter。
  const ccBg = document.getElementById('control-center-bg');
  if (ccBg) {
    ccBg.style.setProperty('opacity', '1', 'important');
    ccBg.style.setProperty('background', 'rgba(0,0,0,0.5)', 'important');
    if (isVisualEffectsEnabled()) {
      ccBg.style.setProperty('backdrop-filter', 'blur(24px) saturate(1.4)', 'important');
      ccBg.style.setProperty('-webkit-backdrop-filter', 'blur(24px) saturate(1.4)', 'important');
    } else {
      ccBg.style.setProperty('backdrop-filter', 'none', 'important');
      ccBg.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    }
  }
}

function closeControlCenter() {
  controlCenter.classList.remove('show');
  controlOpen = false;
  // 关闭控制中心时恢复流体云显示（如果正在播放音乐）
  if (fluidCloud && musicPlaylist.length > 0 && currentMusicIndex >= 0) {
    fluidCloud.classList.remove('in-control-center');
  }
  
  // 重置控制中心背景样式
  const ccBg = document.getElementById('control-center-bg');
  if (ccBg) {
    ccBg.style.opacity = '0';
    ccBg.style.background = 'rgba(0,0,0,0)';
    ccBg.style.backdropFilter = 'blur(0px)';
    ccBg.style.webkitBackdropFilter = 'blur(0px)';
  }
}

// ==================== 电脑端鼠标下拉支持 ====================
let mouseStartY = 0;
let mouseStartX = 0;
let isMouseDragging = false;

// 鼠标按下
document.addEventListener('mousedown', (e) => {
  if (controlOpen) return; // 如果控制中心已打开，则不响应
  // 只在屏幕顶部区域触发
  if (e.clientY < 100) {
    mouseStartY = e.clientY;
    mouseStartX = e.clientX;
    isMouseDragging = true;
    // 防止文本选择
    e.preventDefault();
  }
});

// 鼠标移动
document.addEventListener('mousemove', rafThrottle((e) => {
  if (!isMouseDragging) return;
  const deltaY = e.clientY - mouseStartY;
  const deltaX = Math.abs(e.clientX - mouseStartX);
  
  // 如果向下拖动，可以添加控制中心的预览效果
  if (deltaY > 0 && deltaX < 100) {
    // 可以在这里添加控制中心的预览效果
  }
}));

// 鼠标释放
document.addEventListener('mouseup', (e) => {
  if (!isMouseDragging) return;
  const deltaY = e.clientY - mouseStartY;
  const deltaX = Math.abs(e.clientX - mouseStartX);
  
  // 向下拖动超过80px触发
  if (deltaY > 80 && deltaX < 100) {
    openControlCenter();
  }
  isMouseDragging = false;
});

// 防止拖拽时选中文本
document.addEventListener('selectstart', (e) => {
  if (isMouseDragging) {
    e.preventDefault();
  }
});

if (statusTrigger) {
  statusTrigger.addEventListener('click', (e) => {
    if (!controlOpen) {
      openControlCenter();
    } else {
      closeControlCenter();
    }
  });
}

if (controlCenterBg) {
  controlCenterBg.addEventListener('click', (e) => {
    e.stopPropagation();
    closeControlCenter();
  });
}

if (controlHandle) {
  controlHandle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (controlOpen) closeControlCenter();
  });
}

document.querySelectorAll('.control-item').forEach(item => {
  item.addEventListener('click', function() {
    const controlType = this.getAttribute('data-control');
    if (controlType === 'dark-mode') {
      toggleDarkMode();
      // 手动更新控制中心深色模式开关的状态
      if (isDarkMode) {
        this.classList.add('active');
        this.classList.remove('inactive');
      } else {
        this.classList.remove('active');
        this.classList.add('inactive');
      }
    } else {
      this.classList.toggle('active');
      this.classList.toggle('inactive');
    }
  });
});

// 深色模式切换逻辑
let isDarkMode = false;

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // 更新控制中心开关状态
  const controlDarkMode = document.querySelector('.control-item.control-dark-mode');
  if (controlDarkMode) {
    if (isDarkMode) {
      controlDarkMode.classList.add('active');
      controlDarkMode.classList.remove('inactive');
    } else {
      controlDarkMode.classList.remove('active');
      controlDarkMode.classList.add('inactive');
    }
  }
  
  // 更新设置页面开关状态
  const settingDarkMode = document.querySelector('#dark-mode-setting .item-switch');
  if (settingDarkMode) {
    settingDarkMode.classList.toggle('active', isDarkMode);
  }
  
  // 保存到localStorage
  localStorage.setItem('darkMode', isDarkMode);
}

// 初始化深色模式状态 - 默认亮色模式
function initDarkMode() {
  // 清除之前可能的深色模式设置，确保默认是亮色模式
  localStorage.removeItem('darkMode');
  isDarkMode = false;
  document.body.classList.remove('dark-mode');
  
  // 确保控制中心开关状态为关闭
  const controlDarkMode = document.querySelector('.control-item.control-dark-mode');
  if (controlDarkMode) {
    controlDarkMode.classList.remove('active');
    controlDarkMode.classList.add('inactive');
  }
  
  // 确保设置页面开关状态为关闭
  const settingDarkMode = document.querySelector('#dark-mode-setting .item-switch');
  if (settingDarkMode) {
    settingDarkMode.classList.remove('active');
  }
}

// 为设置页面的深色模式开关添加事件监听器
const settingDarkMode = document.querySelector('#dark-mode-setting .item-switch');
if (settingDarkMode) {
  settingDarkMode.addEventListener('click', toggleDarkMode);
}

// 为设置页面的GPU硬件加速开关添加事件监听器
const gpuSettingItem = document.getElementById('gpu-acceleration-setting');
if (gpuSettingItem) {
  const gpuSwitch = gpuSettingItem.querySelector('.item-switch');
  
  // 初始化开关状态
  const gpuAccelerationEnabled = localStorage.getItem('gpuAcceleration') !== 'false';
  if (gpuSwitch) {
    if (gpuAccelerationEnabled) {
      gpuSwitch.classList.add('active');
    } else {
      gpuSwitch.classList.remove('active');
    }
  }
  
  gpuSettingItem.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const switchEl = gpuSettingItem.querySelector('.item-switch');
    if (!switchEl) return;
    
    const isEnabled = switchEl.classList.contains('active');
    console.log('[GPU] Switch clicked, current state:', isEnabled ? 'enabled' : 'disabled');
    
    if (isEnabled) {
      // 关闭GPU加速
      switchEl.classList.remove('active');
      localStorage.setItem('gpuAcceleration', 'false');
      document.body.classList.remove('gpu-accelerated');
      console.log('[GPU] Hardware acceleration disabled');
    } else {
      // 开启GPU加速
      switchEl.classList.add('active');
      localStorage.setItem('gpuAcceleration', 'true');
      document.body.classList.add('gpu-accelerated');
      console.log('[GPU] Hardware acceleration enabled');
    }
  });
}

// 为设置页面的高级材质开关添加事件监听器
const materialsSettingItem = document.getElementById('advanced-materials-setting');
if (materialsSettingItem) {
  const materialsSwitch = materialsSettingItem.querySelector('.item-switch');
  
  // 初始化开关状态
  const advancedMaterialsEnabled = localStorage.getItem('advancedMaterials') !== 'false';
  if (materialsSwitch) {
    if (advancedMaterialsEnabled) {
      materialsSwitch.classList.add('active');
    } else {
      materialsSwitch.classList.remove('active');
    }
  }
  
  materialsSettingItem.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const switchEl = materialsSettingItem.querySelector('.item-switch');
    if (!switchEl) return;
    
    const isEnabled = switchEl.classList.contains('active');
    console.log('[Materials] Switch clicked, current state:', isEnabled ? 'enabled' : 'disabled');
    
    if (isEnabled) {
      // 关闭高级材质
      switchEl.classList.remove('active');
      localStorage.setItem('advancedMaterials', 'false');
      document.body.classList.remove('advanced-materials');
      console.log('[Materials] Advanced materials disabled');
    } else {
      // 开启高级材质
      switchEl.classList.add('active');
      localStorage.setItem('advancedMaterials', 'true');
      document.body.classList.add('advanced-materials');
      console.log('[Materials] Advanced materials enabled');
    }
  });
}

// 为控制中心的音乐快捷方式添加事件监听器
const shortcutMusic = document.querySelector('.shortcut-item[data-action="music"]');
const controlMusicPlayer = document.getElementById('control-music-player');
const controlMusicTitle = document.getElementById('control-music-title');
const controlMusicStatus = document.getElementById('control-music-status');
const controlMusicPlay = document.getElementById('control-music-play');
const controlMusicPrev = document.getElementById('control-music-prev');
const controlMusicNext = document.getElementById('control-music-next');

// 更新控制中心音乐显示
function updateControlMusicDisplay() {
  if (!controlMusicPlayer) return;
  
  if (musicPlaylist.length > 0 && currentMusicIndex >= 0) {
    controlMusicPlayer.style.display = 'block';
    const music = musicPlaylist[currentMusicIndex];
    if (controlMusicTitle) controlMusicTitle.textContent = music.name;
    if (controlMusicStatus) controlMusicStatus.textContent = isMusicPlaying ? '正在播放' : '已暂停';
    // 更新播放按钮图标
    const controlPlayIcon = document.getElementById('control-play-icon');
    if (controlPlayIcon) {
      controlPlayIcon.setAttribute('d', isMusicPlaying 
        ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'  // 暂停图标
        : 'M8 5v14l11-7z'  // 播放图标
      );
    }
  } else {
    controlMusicPlayer.style.display = 'none';
  }
}

// 点击音乐图标打开音乐应用
if (shortcutMusic) {
  shortcutMusic.addEventListener('click', function() {
    closeControlCenter();
    setTimeout(() => {
      const musicIcon = document.querySelector('[data-app="music"]');
      if (musicIcon) openApp('music', musicIcon);
      // 如果有音乐在播放，跳转到播放器页面
      if (musicPlaylist.length > 0 && currentMusicIndex >= 0) {
        setTimeout(() => {
          const playerItem = document.querySelector('[data-subpage="music-player"]');
          if (playerItem) playerItem.click();
        }, 300);
      }
    }, 300);
  });
}

// 控制中心播放/暂停
if (controlMusicPlay) {
  controlMusicPlay.addEventListener('click', function(e) {
    e.stopPropagation();
    if (musicPlaylist.length === 0) return;
    
    if (isMusicPlaying) {
      musicAudio.pause();
      isMusicPlaying = false;
    } else {
      if (currentMusicIndex === -1) {
        playMusic(0);
      } else {
        musicAudio.play();
        isMusicPlaying = true;
      }
    }
    updateMusicPlayerUI();
    updateMusicPlaylist();
    updateControlMusicDisplay();
  });
}

// 控制中心上一首
if (controlMusicPrev) {
  controlMusicPrev.addEventListener('click', function(e) {
    e.stopPropagation();
    if (musicPlaylist.length === 0) return;
    const newIndex = currentMusicIndex > 0 ? currentMusicIndex - 1 : musicPlaylist.length - 1;
    playMusic(newIndex);
    updateControlMusicDisplay();
  });
}

// 控制中心下一首
if (controlMusicNext) {
  controlMusicNext.addEventListener('click', function(e) {
    e.stopPropagation();
    if (musicPlaylist.length === 0) return;
    const newIndex = currentMusicIndex < musicPlaylist.length - 1 ? currentMusicIndex + 1 : 0;
    playMusic(newIndex);
    updateControlMusicDisplay();
  });
}

// 为设置页面的亮度条添加事件监听器
const settingBrightnessSlider = document.querySelector('#setting-brightness-slider');
const brightnessValue = document.getElementById('brightness-value');
if (settingBrightnessSlider && brightnessValue) {
  let isDragging = false;
  
  function updateBrightness(e) {
    const rect = settingBrightnessSlider.getBoundingClientRect();
    const width = rect.width;
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((x / width) * 100)));
    
    const sliderFill = settingBrightnessSlider.querySelector('.slider-fill');
    if (sliderFill) {
      sliderFill.style.width = percentage + '%';
      brightnessValue.textContent = percentage;
    }
  }
  
  settingBrightnessSlider.addEventListener('mousedown', function(e) {
    isDragging = true;
    updateBrightness(e);
  });
  
  document.addEventListener('mousemove', rafThrottle(function(e) {
    if (isDragging) {
      updateBrightness(e);
    }
  }));
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  settingBrightnessSlider.addEventListener('click', function(e) {
    updateBrightness(e);
  });
}

// 为控制中心的亮度条添加拖动功能
const controlBrightnessSlider = document.getElementById('brightness-slider');
if (controlBrightnessSlider) {
  let isDragging = false;
  
  function updateControlBrightness(e) {
    const rect = controlBrightnessSlider.getBoundingClientRect();
    const width = rect.width;
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((x / width) * 100)));
    
    const sliderFill = controlBrightnessSlider.querySelector('.slider-fill');
    if (sliderFill) {
      sliderFill.style.width = percentage + '%';
    }
  }
  
  controlBrightnessSlider.addEventListener('mousedown', function(e) {
    isDragging = true;
    updateControlBrightness(e);
  });
  
  document.addEventListener('mousemove', rafThrottle(function(e) {
    if (isDragging) {
      updateControlBrightness(e);
    }
  }));
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  controlBrightnessSlider.addEventListener('click', function(e) {
    updateControlBrightness(e);
  });
}

// 初始化深色模式
initDarkMode();

document.querySelectorAll('.shortcut-item').forEach(item => {
  item.addEventListener('click', function() {
    const action = this.getAttribute('data-action');
    if (action === 'camera' || action === 'calculator') {
      closeControlCenter();
      setTimeout(() => {
        const icon = document.querySelector('[data-app="' + action + '"]');
        if (icon) openApp(action, icon);
      }, 300);
    }
  });
});

function setupSlider(slider) {
  if (!slider) return;
  let isDragging = false;
  slider.addEventListener('mousedown', startDrag);
  slider.addEventListener('touchstart', startDrag, { passive: true });
  function startDrag(e) {
    isDragging = true;
    updateSlider(e);
  }
  function updateSlider(e) {
    if (!isDragging) return;
    const rect = slider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    const fill = slider.querySelector('.slider-fill');
    if (fill) fill.style.width = (percent * 100) + '%';
  }
  // 使用节流优化高频滑块更新（约30fps，降低拖动时主线程压力）
  document.addEventListener('mousemove', throttle(updateSlider, 32));
  document.addEventListener('touchmove', throttle(updateSlider, 32), { passive: true });
  document.addEventListener('mouseup', () => isDragging = false);
  document.addEventListener('touchend', () => isDragging = false);
}

setupSlider(document.getElementById('brightness-slider'));
setupSlider(document.getElementById('volume-slider'));

let cKeyPressed = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    if (cKeyPressed) return; // 防止重复触发
    cKeyPressed = true;
    // 全局快捷键，可在任何情况下打开/关闭控制中心
    controlOpen ? closeControlCenter() : openControlCenter();
  }
  // ESC键也可以关闭控制中心
  if (e.key === 'Escape' && controlOpen) {
    closeControlCenter();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    cKeyPressed = false;
  }
});

// ==================== 拨号盘功能 ====================
let dialNumber = '';
const dialDisplay = document.getElementById('dial-display');
const dialHint = document.getElementById('dial-hint');
const callBtn = document.getElementById('call-btn');
const callHint = document.getElementById('call-hint');
const backspaceBtn = document.getElementById('dial-backspace');

function updateDialDisplay() {
  if (dialDisplay) {
    // 格式化显示：每4位加一个空格
    let formatted = dialNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    dialDisplay.textContent = formatted;
  }
  
  // 更新拨打按钮状态
  if (callBtn) {
    if (dialNumber.length > 0) {
      callBtn.style.background = '#34C759';
      callBtn.style.cursor = 'pointer';
      if (callHint) callHint.textContent = '模拟拨号（不会真正拨打电话）';
    } else {
      callBtn.style.background = '#c7c7cc';
      callBtn.style.cursor = 'not-allowed';
      if (callHint) callHint.textContent = '';
    }
  }
  
  // 更新提示文字
  if (dialHint) {
    if (dialNumber.length === 0) {
      dialHint.textContent = '添加号码';
    } else if (dialNumber.length < 3) {
      dialHint.textContent = '继续输入...';
    } else {
      dialHint.textContent = dialNumber.length + ' 位数字';
    }
  }
}

// 绑定拨号按钮
document.querySelectorAll('.dial-btn[data-key]').forEach(btn => {
  btn.addEventListener('click', function() {
    const key = this.getAttribute('data-key');
    if (dialNumber.length < 15) { // 限制最大长度
      dialNumber += key;
      updateDialDisplay();
      
      // 添加点击反馈动画
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);
    }
  });
});

// 删除按钮
if (backspaceBtn) {
  backspaceBtn.addEventListener('click', function() {
    dialNumber = dialNumber.slice(0, -1);
    updateDialDisplay();
    this.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.style.transform = '';
    }, 100);
  });
}

// 长按0输入+
document.querySelector('.dial-btn[data-key="0"]')?.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  if (dialNumber.length < 15) {
    dialNumber += '+';
    updateDialDisplay();
  }
});

// 拨打按钮 - 仅模拟，不真正拨号
if (callBtn) {
  callBtn.addEventListener('click', function() {
    if (dialNumber.length > 0) {
      // 显示模拟拨号提示
      const originalText = dialDisplay.textContent;
      dialDisplay.innerHTML = '<span style="color: #34C759;">正在呼叫...</span>';
      callBtn.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        dialDisplay.innerHTML = '<span style="color: #FF3B30;">无法连接</span><br><span style="font-size: 12px; color: #86868b;">这是模拟器，无法拨打电话</span>';
        callBtn.style.transform = '';
        
        setTimeout(() => {
          dialDisplay.textContent = originalText;
        }, 2000);
      }, 1500);
    }
  });
}

// ==================== 流体云功能 ====================
const fluidCloud = document.getElementById('fluid-cloud');
const fluidCloudCollapsed = document.getElementById('fluid-cloud-collapsed');
const fluidCloudExpanded = document.getElementById('fluid-cloud-expanded');
const fluidCloudTitle = document.getElementById('fluid-cloud-title');
const fluidCloudSubtitle = document.getElementById('fluid-cloud-subtitle');
const fluidCloudIcon = document.getElementById('fluid-cloud-icon');
const fluidCloudCover = document.getElementById('fluid-cloud-cover');
const fluidCloudExpandedTitle = document.getElementById('fluid-cloud-expanded-title');
const fluidCloudExpandedAlbum = document.getElementById('fluid-cloud-expanded-album');
const fluidCloudPlayBtn = document.getElementById('fluid-cloud-play-btn');

let isFluidCloudExpanded = false;

// 更新流体云显示
function updateFluidCloud() {
  console.log('[FluidCloud] updateFluidCloud called, fluidCloud:', fluidCloud, 'musicPlaylist:', musicPlaylist.length, 'currentMusicIndex:', currentMusicIndex);
  if (!fluidCloud) {
    console.error('[FluidCloud] fluidCloud element is null!');
    return;
  }
  
  // 只有在有音乐播放列表且正在播放或暂停时才显示
  if (musicPlaylist.length > 0 && currentMusicIndex >= 0) {
    const music = musicPlaylist[currentMusicIndex];
    console.log('[FluidCloud] Updating with music:', music.name);
    
    // 更新收起状态
    if (fluidCloudTitle) fluidCloudTitle.textContent = music.name;
    if (fluidCloudSubtitle) fluidCloudSubtitle.textContent = isMusicPlaying ? '正在播放' : '已暂停';
    
    // 更新展开状态
    if (fluidCloudExpandedTitle) fluidCloudExpandedTitle.textContent = music.name;
    if (fluidCloudExpandedAlbum) {
      fluidCloudExpandedAlbum.textContent = music.fromGithub ? '从网络源获取' : '本地音乐';
    }
    // 更新播放按钮图标
    const playIconPath = document.getElementById('fluid-cloud-play-icon');
    if (playIconPath) {
      playIconPath.setAttribute('d', isMusicPlaying 
        ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'  // 暂停图标（两条竖线）
        : 'M8 5v14l11-7z'  // 播放图标（三角形）
      );
    }
    
    // 显示流体云
    fluidCloud.classList.add('show');
    console.log('[FluidCloud] Added show class, classes:', fluidCloud.className);
    
    // 根据播放状态添加/移除暂停样式
    if (isMusicPlaying) {
      fluidCloud.classList.remove('paused');
    } else {
      fluidCloud.classList.add('paused');
    }
  } else {
    console.log('[FluidCloud] Hiding fluid cloud');
    // 隐藏流体云
    fluidCloud.classList.remove('show');
    fluidCloud.classList.remove('expanded');
    isFluidCloudExpanded = false;
  }
}

// 流体云展开/收起切换
function fluidCloudToggleExpand() {
  console.log('[FluidCloud] Toggle expand called, fluidCloud:', fluidCloud);
  if (!fluidCloud) {
    console.error('[FluidCloud] fluidCloud element not found!');
    return;
  }
  
  isFluidCloudExpanded = !isFluidCloudExpanded;
  console.log('[FluidCloud] isFluidCloudExpanded:', isFluidCloudExpanded);
  
  if (isFluidCloudExpanded) {
    fluidCloud.classList.add('expanded');
    console.log('[FluidCloud] Added expanded class');
  } else {
    fluidCloud.classList.remove('expanded');
    console.log('[FluidCloud] Removed expanded class');
  }
}

// 流体云打开应用 - 从流体云位置缩放到全屏
function fluidCloudOpenApp() {
  console.log('[FluidCloud] Open app called, musicPlaylist:', musicPlaylist.length);
  if (musicPlaylist.length === 0) {
    console.warn('[FluidCloud] No music in playlist');
    return;
  }
  
  // 获取流体云展开元素的位置
  const fluidCloudRect = fluidCloudExpanded.getBoundingClientRect();
  console.log('[FluidCloud] Fluid cloud rect:', fluidCloudRect);
  
  // 关闭控制中心（如果打开）
  closeControlCenter();
  
  // 先收起流体云
  fluidCloud.classList.remove('expanded');
  isFluidCloudExpanded = false;
  
  // 延迟后打开音乐应用，实现从流体云位置展开的动画
  setTimeout(() => {
    const musicIcon = document.querySelector('[data-app="music"]');
    console.log('[FluidCloud] Music icon:', musicIcon);
    if (musicIcon) {
      // 保存流体云位置用于动画
      window.fluidCloudOrigin = {
        x: fluidCloudRect.left + fluidCloudRect.width / 2,
        y: fluidCloudRect.top + fluidCloudRect.height / 2
      };
      console.log('[FluidCloud] Origin set to:', window.fluidCloudOrigin);
      
      openAppFromFluidCloud('music', musicIcon);
    } else {
      console.error('[FluidCloud] Music icon not found!');
    }
  }, 200);
}

// 从流体云位置打开应用（带缩放动画）
function openAppFromFluidCloud(appName, clickIcon) {
  resetAllPages();
  currentIcon = clickIcon;
  
  // 使用流体云位置作为动画起点
  const cx = window.fluidCloudOrigin ? window.fluidCloudOrigin.x : window.innerWidth / 2;
  const cy = window.fluidCloudOrigin ? window.fluidCloudOrigin.y : window.innerHeight / 2;
  
  app.style.transformOrigin = cx + 'px ' + cy + 'px';
  
  const targetPage = document.getElementById('page-' + appName);
  if (!targetPage) return;

  currentPage = targetPage;
  currentPage.classList.add('show');

  // 添加壁纸缩放效果和应用显示
  desktop.classList.add('app-open');
  blur.classList.add('app-open');
  status.classList.add('hidden');
  blur.classList.add('active');

  // 应用从流体云位置缩放的动画
  app.style.transform = 'scale(0)';
  app.style.opacity = '0';
  app.classList.add('show');

  // 强制重绘
  app.offsetHeight;

  // 开始缩放动画
  app.style.transition = 'transform 0.5s var(--ios-spring), opacity 0.3s var(--ios-smooth)';
  app.style.transform = 'scale(1)';
  app.style.opacity = '1';
  
  // 如果打开的是音乐应用，隐藏流体云
  if (appName === 'music' && fluidCloud) {
    fluidCloud.classList.add('in-music-app');
  }
  
  // 跳转到播放器页面
  setTimeout(() => {
    const playerItem = document.querySelector('[data-subpage="music-player"]');
    if (playerItem) playerItem.click();
  }, 400);
}

// 流体云播放/暂停切换
function fluidCloudTogglePlay() {
  if (musicPlaylist.length === 0) return;
  
  if (currentMusicIndex === -1) {
    playMusic(0);
    return;
  }
  
  if (isMusicPlaying) {
    musicAudio.pause();
    isMusicPlaying = false;
  } else {
    musicAudio.play();
    isMusicPlaying = true;
  }
  
  updateMusicPlayerUI();
  updateMusicPlaylist();
  updateFluidCloud();
  updateControlMusicDisplay();
}

// 流体云上一首
function fluidCloudPrev() {
  if (musicPlaylist.length === 0) return;
  const newIndex = currentMusicIndex > 0 ? currentMusicIndex - 1 : musicPlaylist.length - 1;
  playMusic(newIndex);
}

// 流体云下一首
function fluidCloudNext() {
  if (musicPlaylist.length === 0) return;
  const newIndex = currentMusicIndex < musicPlaylist.length - 1 ? currentMusicIndex + 1 : 0;
  playMusic(newIndex);
}

// 将流体云函数挂载到 window 对象，供 HTML 内联事件调用
window.fluidCloudToggleExpand = fluidCloudToggleExpand;
window.fluidCloudOpenApp = fluidCloudOpenApp;
window.fluidCloudTogglePlay = fluidCloudTogglePlay;
window.fluidCloudPrev = fluidCloudPrev;
window.fluidCloudNext = fluidCloudNext;
console.log('[FluidCloud] Functions mounted to window');

// 点击外部区域收起流体云
document.addEventListener('click', function(e) {
  if (isFluidCloudExpanded && fluidCloud && !fluidCloud.contains(e.target)) {
    fluidCloud.classList.remove('expanded');
    isFluidCloudExpanded = false;
    console.log('[FluidCloud] Collapsed by clicking outside');
  }
});

// ==================== 音乐播放器功能 ====================
let musicPlaylist = [];
let currentMusicIndex = -1;
let isMusicPlaying = false;

const musicUploadBtn = document.getElementById('music-upload-btn');
const musicFileInput = document.getElementById('music-file-input');
const musicPlaylistContainer = document.getElementById('music-playlist');
const musicAudio = document.getElementById('music-audio');
const musicPlayBtn = document.getElementById('music-play-btn');
const musicPrevBtn = document.getElementById('music-prev');
const musicNextBtn = document.getElementById('music-next');
const musicProgressBar = document.getElementById('music-progress-bar');
const musicProgressFill = document.getElementById('music-progress-fill');
const musicCurrentTime = document.getElementById('music-current-time');
const musicDuration = document.getElementById('music-duration');
const musicTitle = document.getElementById('music-title');
const musicSinger = document.getElementById('music-singer');
const musicCover = document.getElementById('music-cover');

// 上传音乐按钮点击
if (musicUploadBtn && musicFileInput) {
  musicUploadBtn.addEventListener('click', function() {
    musicFileInput.click();
  });
}

// GitHub音乐按钮点击
const musicGithubBtn = document.getElementById('music-github-btn');
const githubMusicModal = document.getElementById('github-music-modal');
const closeGithubModal = document.getElementById('close-github-modal');
const githubMusicList = document.getElementById('github-music-list');

if (musicGithubBtn && githubMusicModal) {
  musicGithubBtn.addEventListener('click', function() {
    githubMusicModal.style.display = 'flex';
    // 触发重排，然后设置opacity
    void githubMusicModal.offsetWidth;
    githubMusicModal.style.opacity = '1';
    loadGithubMusicList(2);
  });
}

if (closeGithubModal && githubMusicModal) {
  closeGithubModal.addEventListener('click', function() {
    githubMusicModal.style.opacity = '0';
    // 过渡结束后隐藏
    setTimeout(function() {
      githubMusicModal.style.display = 'none';
    }, 300);
  });
}

// 音乐基础URL
const MUSIC_ERX399 = "https://raw.githubusercontent.com/ERX399/ker/a633030360fc27422201de7c9985d0a65525a19a/%E9%9F%B3%E4%B9%90/";
const MUSIC_SUI = "https://raw.githubusercontent.com/ThinkReally114/Source-UI/ac77ff557f48fa191c272de0576276db89df6132/Music/";
const MUSIC_ZEPHYRIX = "https://raw.githubusercontent.com/ERX399/zephyrix/main/音乐/";

// 预定义音乐列表，当API调用失败时使用
const predefinedMusic = {
  1: [ // 从第三方获取
    { n: "嘘月", u: MUSIC_ZEPHYRIX + "嘘月.mp3" },
    { n: "リテラチュア", u: MUSIC_ZEPHYRIX + "リテラチュア(魔女之旅主题曲.mp3" },
    { n: "星茶会", u: MUSIC_ZEPHYRIX + "星茶会.mp3" },
    { n: "I Can't Wait", u: MUSIC_ZEPHYRIX + "I Can't Wait.mp3" },
    { n: "你最近还好吗", u: MUSIC_ZEPHYRIX + "你最近还好吗.mp3" },
    { n: "带我走", u: MUSIC_ZEPHYRIX + "带我走.mp3" },
    { n: "我们", u: MUSIC_ZEPHYRIX + "我们.mp3" },
    { n: "爱你", u: MUSIC_ZEPHYRIX + "爱你.mp3" },
    { n: "雨爱", u: MUSIC_ZEPHYRIX + "雨爱.mp3" },
    { n: "鸟之诗-八音盒", u: MUSIC_ZEPHYRIX + "鸟之诗-八音盒.mp3" }
  ],
  2: [ // 从sui仓库获取
    { n: "Total Dominstion", u: MUSIC_SUI + "Total Dominstion.mp3" },
    { n: "stalk ur socials", u: MUSIC_SUI + "stalk ur socials.mp3" },
    { n: "unhappy", u: MUSIC_SUI + "unhappy.mp3" },
    { n: "人生逃避号", u: MUSIC_SUI + "人生逃避号.mp3" },
    { n: "完美的真空", u: MUSIC_SUI + "完美的真空.mp3" },
    { n: "山神", u: MUSIC_SUI + "山神.mp3" },
    { n: "稻香", u: MUSIC_SUI + "稻香.mp3" },
    { n: "还愿", u: MUSIC_SUI + "还愿.mp3" }
  ]
};

// 加载GitHub音乐列表
function loadGithubMusicList(source = 2) {
  if (!githubMusicList) return;
  
  // 更新源按钮状态
  const sourceBtn1 = document.getElementById('music-source-1');
  const sourceBtn2 = document.getElementById('music-source-2');
  if (sourceBtn1 && sourceBtn2) {
    if (source === 1) {
      sourceBtn1.style.background = 'var(--primary-blue)';
      sourceBtn1.style.color = '#fff';
      sourceBtn1.style.border = 'none';
      sourceBtn2.style.background = 'var(--bg-light)';
      sourceBtn2.style.color = 'var(--text-primary)';
      sourceBtn2.style.border = '1px solid var(--line-gray)';
    } else {
      sourceBtn2.style.background = 'var(--primary-blue)';
      sourceBtn2.style.color = '#fff';
      sourceBtn2.style.border = 'none';
      sourceBtn1.style.background = 'var(--bg-light)';
      sourceBtn1.style.color = 'var(--text-primary)';
      sourceBtn1.style.border = '1px solid var(--line-gray)';
    }
  }
  
  githubMusicList.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; padding: 40px; color: var(--text-gray);">
      <div>加载中...</div>
    </div>
  `;
  
  // 使用预定义的音乐列表
  setTimeout(() => {
    const musicList = predefinedMusic[source] || [];
    
    if (musicList.length === 0) {
      githubMusicList.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; padding: 40px; color: var(--text-gray);">
          <div>暂无音乐文件</div>
        </div>
      `;
      return;
    }
    
    // 生成音乐列表
    githubMusicList.innerHTML = '';
    musicList.forEach(music => {
      const musicItem = document.createElement('div');
      musicItem.className = 'item';
      musicItem.style.cursor = 'pointer';
      musicItem.style.display = 'flex';
      musicItem.style.alignItems = 'center';
      musicItem.style.padding = '12px 16px';
      musicItem.style.borderRadius = '12px';
      musicItem.style.transition = 'background 0.2s';
      musicItem.innerHTML = `
        <div class="item-icon" style="background: #333; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin-right: 12px;"><svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px; color: #fff;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
        <div style="flex: 1; overflow: hidden;">
          <div class="item-text" style="font-size: 15px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${music.n}</div>
        </div>
        <div class="item-arrow" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 18px;">+</div>
      `;
      
      // 添加悬停效果
      musicItem.addEventListener('mouseenter', function() {
        musicItem.style.background = 'rgba(0,0,0,0.05)';
      });
      
      musicItem.addEventListener('mouseleave', function() {
        musicItem.style.background = 'transparent';
      });
      
      musicItem.addEventListener('click', function() {
        // 添加到播放列表
        const newMusicItem = {
          name: music.n,
          url: music.u,
          fromGithub: true
        };
        
        musicPlaylist.push(newMusicItem);
        updateMusicPlaylist();
        
        // 显示添加成功提示
        showToast('音乐已添加到播放列表');
        
        // 如果这是第一首歌，自动播放
        if (musicPlaylist.length === 1 && currentMusicIndex === -1) {
          playMusic(0);
        }
      });
      
      githubMusicList.appendChild(musicItem);
    });
  }, 500);
}

// 显示内置提示
function showToast(message) {
  const toast = document.getElementById('music-toast');
  if (toast) {
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
  }
}

// 为源选择按钮添加事件监听器
const musicSource1 = document.getElementById('music-source-1');
const musicSource2 = document.getElementById('music-source-2');

if (musicSource1) {
  musicSource1.addEventListener('click', function() {
    loadGithubMusicList(1);
  });
}

if (musicSource2) {
  musicSource2.addEventListener('click', function() {
    loadGithubMusicList(2);
  });
}

// 文件选择处理
if (musicFileInput) {
  musicFileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac)$/i)) {
        const musicItem = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          file: file,
          url: URL.createObjectURL(file)
        };
        musicPlaylist.push(musicItem);
      }
    });
    updateMusicPlaylist();
    // 如果这是第一首歌，自动播放
    if (musicPlaylist.length === files.length && currentMusicIndex === -1) {
      playMusic(0);
    }
  });
}

// 更新播放列表显示
function updateMusicPlaylist() {
  if (!musicPlaylistContainer) return;
  
  if (musicPlaylist.length === 0) {
    musicPlaylistContainer.innerHTML = '<div class="item" style="justify-content: center; color: var(--text-gray);"><div class="item-text">暂无音乐，请点击"导入音乐"导入</div></div>';
    return;
  }
  
  musicPlaylistContainer.innerHTML = '';
  musicPlaylist.forEach((item, index) => {
    const musicItem = document.createElement('div');
    musicItem.className = 'item';
    musicItem.style.cursor = 'pointer';
    musicItem.innerHTML = `
      <div class="item-icon" style="background: #FF2D55"><svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
      <div class="item-text">${item.name}</div>
      <div class="item-arrow">${index === currentMusicIndex ? (isMusicPlaying ? '▶' : '⏸') : '>'}</div>
    `;
    musicItem.addEventListener('click', function() {
      playMusic(index);
    });
    musicPlaylistContainer.appendChild(musicItem);
  });
}

// 播放指定音乐
function playMusic(index) {
  if (index < 0 || index >= musicPlaylist.length) return;
  
  currentMusicIndex = index;
  const music = musicPlaylist[index];
  
  if (musicAudio) {
    musicAudio.src = music.url;
    const playPromise = musicAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // 忽略播放中断错误，这是正常的浏览器行为
        if (error.name !== 'AbortError') {
          console.error('[Music] Play error:', error);
        }
      });
    }
    isMusicPlaying = true;
    updateMusicPlayerUI();
    updateMusicPlaylist();
    updateFluidCloud();
  }
}

// 更新播放器UI
function updateMusicPlayerUI() {
  if (currentMusicIndex === -1 || !musicPlaylist[currentMusicIndex]) return;

  const music = musicPlaylist[currentMusicIndex];
  if (musicTitle) musicTitle.textContent = music.name;
  if (musicSinger) {
    musicSinger.textContent = music.fromGithub ? '从网络源获取' : '本地音乐';
  }
  // 更新播放按钮图标
  const musicPlayIcon = document.getElementById('music-play-icon');
  if (musicPlayIcon) {
    musicPlayIcon.setAttribute('d', isMusicPlaying
      ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'  // 暂停图标
      : 'M8 5v14l11-7z'  // 播放图标
    );
  }

  // 同时更新控制中心显示
  updateControlMusicDisplay();

  // 更新流体云显示
  updateFluidCloud();
}

// 播放/暂停切换
if (musicPlayBtn && musicAudio) {
  musicPlayBtn.addEventListener('click', function() {
    if (currentMusicIndex === -1) {
      if (musicPlaylist.length > 0) {
        playMusic(0);
      }
      return;
    }
    
    if (isMusicPlaying) {
      musicAudio.pause();
      isMusicPlaying = false;
    } else {
      musicAudio.play();
      isMusicPlaying = true;
    }
    updateMusicPlayerUI();
    updateMusicPlaylist();
  });
}

// 上一首
if (musicPrevBtn) {
  musicPrevBtn.addEventListener('click', function() {
    if (musicPlaylist.length === 0) return;
    const newIndex = currentMusicIndex > 0 ? currentMusicIndex - 1 : musicPlaylist.length - 1;
    playMusic(newIndex);
  });
}

// 下一首
if (musicNextBtn) {
  musicNextBtn.addEventListener('click', function() {
    if (musicPlaylist.length === 0) return;
    const newIndex = currentMusicIndex < musicPlaylist.length - 1 ? currentMusicIndex + 1 : 0;
    playMusic(newIndex);
  });
}

// 音频事件监听
if (musicAudio) {
  // 加载完成
  musicAudio.addEventListener('loadedmetadata', function() {
    if (musicDuration) {
      musicDuration.textContent = formatMusicTime(musicAudio.duration);
    }
  });
  
  // 播放结束
  musicAudio.addEventListener('ended', function() {
    if (musicPlaylist.length > 0) {
      const newIndex = currentMusicIndex < musicPlaylist.length - 1 ? currentMusicIndex + 1 : 0;
      playMusic(newIndex);
    }
  });
}

// 进度条点击和拖动
if (musicProgressBar && musicAudio) {
  let isDragging = false;
  let wasPlaying = false;
  
  // 点击跳转
  musicProgressBar.addEventListener('click', function(e) {
    if (!musicAudio.duration) return;
    const rect = musicProgressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
  });
  
  // 鼠标按下开始拖动
  musicProgressBar.addEventListener('mousedown', function(e) {
    if (!musicAudio.duration) return;
    isDragging = true;
    wasPlaying = !musicAudio.paused;
    if (wasPlaying) musicAudio.pause();
    updateProgressFromEvent(e);
    e.preventDefault();
  });
  
  // 鼠标移动时更新进度
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    updateProgressFromEvent(e);
  });
  
  // 鼠标释放结束拖动
  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    updateProgressFromEvent(e);
    if (wasPlaying) musicAudio.play();
  });
  
  // 触摸开始
  musicProgressBar.addEventListener('touchstart', function(e) {
    if (!musicAudio.duration) return;
    isDragging = true;
    wasPlaying = !musicAudio.paused;
    if (wasPlaying) musicAudio.pause();
    updateProgressFromTouch(e.touches[0]);
  }, { passive: false });
  
  // 触摸移动
  musicProgressBar.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    e.preventDefault();
    updateProgressFromTouch(e.touches[0]);
  }, { passive: false });
  
  // 触摸结束
  musicProgressBar.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;
    if (wasPlaying) musicAudio.play();
  });
  
  // 从鼠标事件更新进度
  function updateProgressFromEvent(e) {
    const rect = musicProgressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
    // 立即更新进度条显示
    if (musicProgressFill) {
      musicProgressFill.style.width = (percent * 100) + '%';
    }
    // 立即更新时间显示
    if (musicCurrentTime) {
      musicCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
    }
    // 立即更新歌词
    updateLyrics(musicAudio.currentTime);
    updateFullscreenLyrics(musicAudio.currentTime);
  }
  
  // 从触摸事件更新进度
  function updateProgressFromTouch(touch) {
    const rect = musicProgressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
    // 立即更新进度条显示
    if (musicProgressFill) {
      musicProgressFill.style.width = (percent * 100) + '%';
    }
    // 立即更新时间显示
    if (musicCurrentTime) {
      musicCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
    }
    // 立即更新歌词
    updateLyrics(musicAudio.currentTime);
    updateFullscreenLyrics(musicAudio.currentTime);
  }
}

// 格式化时间
function formatMusicTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ==================== 全屏歌词功能 ====================
let isFullscreenLyrics = false;

const fullscreenLyrics = document.getElementById('fullscreen-lyrics');
const fullscreenLyricsContent = document.getElementById('fullscreen-lyrics-content');
const musicPlayer = document.getElementById('music-player');
const musicInfo = document.getElementById('music-info');
const musicProgressContainer = document.getElementById('music-progress-container');
const musicControls = document.getElementById('music-controls');
const musicLyricsImport = document.getElementById('music-lyrics-import');
const fullscreenSongInfo = document.getElementById('fullscreen-song-info');
const fullscreenArtistInfo = document.getElementById('fullscreen-artist-info');
const fullscreenCurrentTime = document.getElementById('fullscreen-current-time');
const fullscreenDuration = document.getElementById('fullscreen-duration');
const fullscreenProgressContainer = document.getElementById('fullscreen-progress-container');
const fullscreenProgressFill = document.getElementById('fullscreen-progress-fill');
const fullscreenPlayBtn = document.getElementById('fullscreen-play-btn');
const fullscreenPrevBtn = document.getElementById('fullscreen-prev-btn');
const fullscreenNextBtn = document.getElementById('fullscreen-next-btn');
const exitFullscreenBtn = document.querySelector('.exit-fullscreen-btn');

// 切换全屏歌词
function toggleFullscreenLyrics() {
  if (!fullscreenLyrics) return;
  
  isFullscreenLyrics = !isFullscreenLyrics;
  
  if (isFullscreenLyrics) {
    // 更新歌名显示
    const fullscreenSongTitle = document.getElementById('fullscreen-song-title');
    if (fullscreenSongTitle && musicPlaylist.length > 0 && currentMusicIndex >= 0) {
      fullscreenSongTitle.textContent = musicPlaylist[currentMusicIndex].name;
    }
    
    // 显示全屏歌词
    fullscreenLyrics.style.display = 'block';
    // Initial state for entrance animation (从右边进入)
    fullscreenLyrics.style.opacity = '0';
    fullscreenLyrics.style.transform = 'translateX(100%)';
    
    // 隐藏其他元素 with transition
    if (musicCover) musicCover.style.transition = 'opacity 0.4s ease';
    if (musicInfo) musicInfo.style.transition = 'opacity 0.4s ease';
    if (musicLyricsImport) musicLyricsImport.style.transition = 'opacity 0.4s ease';
    if (musicProgressContainer) musicProgressContainer.style.transition = 'opacity 0.4s ease';
    if (musicControls) musicControls.style.transition = 'opacity 0.4s ease';
    
    if (musicCover) musicCover.style.opacity = '0';
    if (musicInfo) musicInfo.style.opacity = '0';
    if (musicLyricsImport) musicLyricsImport.style.opacity = '0';
    if (musicProgressContainer) musicProgressContainer.style.opacity = '0';
    if (musicControls) musicControls.style.opacity = '0';
    
    // Force reflow and then apply animation
    void fullscreenLyrics.offsetWidth;
    
    // Animate entrance (从右到左滑入)
    fullscreenLyrics.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    fullscreenLyrics.style.opacity = '1';
    fullscreenLyrics.style.transform = 'translateX(0)';
    
    // 隐藏其他元素
    setTimeout(() => {
      if (musicCover) musicCover.style.display = 'none';
      if (musicInfo) musicInfo.style.display = 'none';
      if (musicLyricsImport) musicLyricsImport.style.display = 'none';
      if (musicProgressContainer) musicProgressContainer.style.display = 'none';
      if (musicControls) musicControls.style.display = 'none';
    }, 400);
    
    // 更新时间信息
    if (currentMusicIndex >= 0 && musicPlaylist[currentMusicIndex]) {
      if (fullscreenCurrentTime && musicAudio && musicAudio.currentTime) {
        fullscreenCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
      }
      if (fullscreenDuration && musicAudio && musicAudio.duration) {
        fullscreenDuration.textContent = formatMusicTime(musicAudio.duration);
      }
    }
    
    // 加载歌词到全屏
    loadFullscreenLyrics();
    
    // 更新播放按钮状态
    updateFullscreenPlayButton();
    
    // 立即更新歌词显示，确保当前歌词在正确位置
    if (musicAudio && musicAudio.currentTime) {
      setTimeout(() => {
        updateFullscreenLyrics(musicAudio.currentTime);
      }, 100);
    }
  } else {
    // Prepare for exit animation (向右滑出)
    fullscreenLyrics.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    fullscreenLyrics.style.opacity = '0';
    fullscreenLyrics.style.transform = 'translateX(100%)';
    
    // Show other elements with transition
    if (musicCover) {
      musicCover.style.display = 'block';
      musicCover.style.opacity = '0';
      musicCover.style.transition = 'opacity 0.4s ease';
    }
    if (musicInfo) {
      musicInfo.style.display = 'block';
      musicInfo.style.opacity = '0';
      musicInfo.style.transition = 'opacity 0.4s ease';
    }
    if (musicLyricsImport) {
      musicLyricsImport.style.display = 'flex';
      musicLyricsImport.style.opacity = '0';
      musicLyricsImport.style.transition = 'opacity 0.4s ease';
    }
    if (musicProgressContainer) {
      musicProgressContainer.style.display = 'block';
      musicProgressContainer.style.opacity = '0';
      musicProgressContainer.style.transition = 'opacity 0.4s ease';
    }
    if (musicControls) {
      musicControls.style.display = 'flex';
      musicControls.style.opacity = '0';
      musicControls.style.transition = 'opacity 0.4s ease';
    }
    
    // Animate other elements back in after a delay
    setTimeout(() => {
      if (musicCover) musicCover.style.opacity = '1';
      if (musicInfo) musicInfo.style.opacity = '1';
      if (musicLyricsImport) musicLyricsImport.style.opacity = '1';
      if (musicProgressContainer) musicProgressContainer.style.opacity = '1';
      if (musicControls) musicControls.style.opacity = '1';
      
      // Finally hide the fullscreen lyrics after animation completes
      fullscreenLyrics.style.display = 'none';
    }, 300);
  }
}
window.toggleFullscreenLyrics = toggleFullscreenLyrics;

// 加载全屏歌词
function loadFullscreenLyrics() {
  if (!fullscreenLyricsContent) return;
  
  if (currentLyrics.length === 0) {
    fullscreenLyricsContent.innerHTML = '<div class="fullscreen-lyric-line initial" style="color: rgba(255,255,255,0.5); font-size: 24px; line-height: 1.6; margin: 15px 0; font-weight: 400; transition: all 0.4s ease; text-align: left; filter: blur(2px);">暂无歌词</div>';
    return;
  }
  
  fullscreenLyricsContent.innerHTML = '';
  currentLyrics.forEach((line, index) => {
    const lyricLine = document.createElement('div');
    lyricLine.className = 'fullscreen-lyric-line';
    lyricLine.dataset.index = index;
    lyricLine.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 24px; line-height: 1.6; margin: 15px 0; font-weight: 400; transition: all 0.4s ease; text-align: left; filter: blur(1px);';
    lyricLine.textContent = line.text;
    fullscreenLyricsContent.appendChild(lyricLine);
  });
  
}

// 更新全屏歌词显示
function updateFullscreenLyrics(currentTime) {
  if (!fullscreenLyricsContent || currentLyrics.length === 0) return;
  if (!isFullscreenLyrics) return;
  
  // 找到当前播放的歌词
  let newIndex = -1;
  for (let i = 0; i < currentLyrics.length; i++) {
    if (currentLyrics[i].time <= currentTime) {
      newIndex = i;
    } else {
      break;
    }
  }
  
  if (newIndex < 0) newIndex = 0;
  
  // 获取歌词元素
  const lyricElements = fullscreenLyricsContent.querySelectorAll('.fullscreen-lyric-line');
  if (lyricElements.length === 0) return;
  
  // Reset all styles first with smooth transitions
  lyricElements.forEach((line, index) => {
    line.style.transition = 'all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
    line.style.color = 'rgba(255,255,255,0.5)';
    line.style.fontSize = '24px';
    line.style.fontWeight = '300';
    line.style.transform = 'scale(1)';
    line.style.opacity = '0.5';
    line.style.filter = 'blur(1px)';
  });
  
  // Highlight current lyric and scroll
  if (lyricElements[newIndex]) {
    const currentLine = lyricElements[newIndex];
    currentLine.style.transition = 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)';
    currentLine.style.color = 'white';
    currentLine.style.fontSize = '28px';
    currentLine.style.fontWeight = '600';
    currentLine.style.transform = 'scale(1.05)';
    currentLine.style.opacity = '1';
    currentLine.style.filter = 'blur(0)';
    
    // 使用 offsetTop 计算滚动位置
    // 让当前歌词显示在容器中央偏上的位置
    const container = document.querySelector('.fullscreen-lyrics-container');
    const targetY = 100; // 目标位置：更靠下一些
    const currentOffsetTop = currentLine.offsetTop;
    const translateY = targetY - currentOffsetTop;
    
    fullscreenLyricsContent.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)';
    fullscreenLyricsContent.style.transform = `translateY(${translateY}px)`;
  }
}

// 更新全屏播放按钮状态
function updateFullscreenPlayButton() {
  if (!fullscreenPlayBtn || !musicAudio) return;
  
  if (!musicAudio.paused) {
    fullscreenPlayBtn.innerHTML = '⏸';
  } else {
    fullscreenPlayBtn.innerHTML = '▶';
  }
}

// 绑定全屏歌词控制按钮事件
if (fullscreenPlayBtn) {
  fullscreenPlayBtn.addEventListener('click', function() {
    if (musicAudio) {
      if (musicAudio.paused) {
        musicAudio.play();
      } else {
        musicAudio.pause();
      }
      updateFullscreenPlayButton();
    }
  });
}

if (fullscreenPrevBtn) {
  fullscreenPrevBtn.addEventListener('click', function() {
    playPrevMusic();
  });
}

if (fullscreenNextBtn) {
  fullscreenNextBtn.addEventListener('click', function() {
    playNextMusic();
  });
}

if (exitFullscreenBtn) {
  exitFullscreenBtn.addEventListener('click', function(e) {
    e.stopPropagation(); // 防止冒泡触发toggleFullscreenLyrics
    if (isFullscreenLyrics) {
      // Prepare for exit animation (向右滑出)
      fullscreenLyrics.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      fullscreenLyrics.style.opacity = '0';
      fullscreenLyrics.style.transform = 'translateX(100%)';
      
      // Show other elements with transition
      if (musicCover) {
        musicCover.style.display = 'block';
        musicCover.style.opacity = '0';
        musicCover.style.transition = 'opacity 0.4s ease';
      }
      if (musicInfo) {
        musicInfo.style.display = 'block';
        musicInfo.style.opacity = '0';
        musicInfo.style.transition = 'opacity 0.4s ease';
      }
      if (musicLyricsImport) {
        musicLyricsImport.style.display = 'flex';
        musicLyricsImport.style.opacity = '0';
        musicLyricsImport.style.transition = 'opacity 0.4s ease';
      }
      if (musicProgressContainer) {
        musicProgressContainer.style.display = 'block';
        musicProgressContainer.style.opacity = '0';
        musicProgressContainer.style.transition = 'opacity 0.4s ease';
      }
      if (musicControls) {
        musicControls.style.display = 'flex';
        musicControls.style.opacity = '0';
        musicControls.style.transition = 'opacity 0.4s ease';
      }
      
      // 等待动画完成后再真正隐藏全屏歌词
      setTimeout(() => {
        isFullscreenLyrics = false;
        fullscreenLyrics.style.display = 'none';
        
        // 完全显示其他元素
        if (musicCover) musicCover.style.opacity = '1';
        if (musicInfo) musicInfo.style.opacity = '1';
        if (musicLyricsImport) musicLyricsImport.style.opacity = '1';
        if (musicProgressContainer) musicProgressContainer.style.opacity = '1';
        if (musicControls) musicControls.style.opacity = '1';
      }, 300);
    }
  });
}

// 绑定全屏进度条点击和拖动事件
if (fullscreenProgressContainer && musicAudio) {
  let isFullscreenDragging = false;
  let wasFullscreenPlaying = false;
  
  // 点击跳转
  fullscreenProgressContainer.addEventListener('click', function(e) {
    if (!musicAudio || isNaN(musicAudio.duration)) return;
    const rect = this.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
  });
  
  // 鼠标按下开始拖动
  fullscreenProgressContainer.addEventListener('mousedown', function(e) {
    if (!musicAudio || isNaN(musicAudio.duration)) return;
    isFullscreenDragging = true;
    wasFullscreenPlaying = !musicAudio.paused;
    if (wasFullscreenPlaying) musicAudio.pause();
    updateFullscreenProgressFromEvent(e);
    e.preventDefault();
  });
  
  // 鼠标移动时更新进度
  document.addEventListener('mousemove', function(e) {
    if (!isFullscreenDragging) return;
    updateFullscreenProgressFromEvent(e);
  });
  
  // 鼠标释放结束拖动
  document.addEventListener('mouseup', function(e) {
    if (!isFullscreenDragging) return;
    isFullscreenDragging = false;
    updateFullscreenProgressFromEvent(e);
    if (wasFullscreenPlaying) musicAudio.play();
  });
  
  // 触摸开始
  fullscreenProgressContainer.addEventListener('touchstart', function(e) {
    if (!musicAudio || isNaN(musicAudio.duration)) return;
    isFullscreenDragging = true;
    wasFullscreenPlaying = !musicAudio.paused;
    if (wasFullscreenPlaying) musicAudio.pause();
    updateFullscreenProgressFromTouch(e.touches[0]);
  }, { passive: false });
  
  // 触摸移动
  fullscreenProgressContainer.addEventListener('touchmove', function(e) {
    if (!isFullscreenDragging) return;
    e.preventDefault();
    updateFullscreenProgressFromTouch(e.touches[0]);
  }, { passive: false });
  
  // 触摸结束
  fullscreenProgressContainer.addEventListener('touchend', function(e) {
    if (!isFullscreenDragging) return;
    isFullscreenDragging = false;
    if (wasFullscreenPlaying) musicAudio.play();
  });
  
  // 从鼠标事件更新进度
  function updateFullscreenProgressFromEvent(e) {
    const rect = fullscreenProgressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
    // 立即更新进度条显示
    if (fullscreenProgressFill) {
      fullscreenProgressFill.style.width = (percent * 100) + '%';
    }
    // 立即更新时间显示
    if (fullscreenCurrentTime) {
      fullscreenCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
    }
    // 立即更新歌词
    updateLyrics(musicAudio.currentTime);
    updateFullscreenLyrics(musicAudio.currentTime);
  }
  
  // 从触摸事件更新进度
  function updateFullscreenProgressFromTouch(touch) {
    const rect = fullscreenProgressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    musicAudio.currentTime = percent * musicAudio.duration;
    // 立即更新进度条显示
    if (fullscreenProgressFill) {
      fullscreenProgressFill.style.width = (percent * 100) + '%';
    }
    // 立即更新时间显示
    if (fullscreenCurrentTime) {
      fullscreenCurrentTime.textContent = formatMusicTime(musicAudio.currentTime);
    }
    // 立即更新歌词
    updateLyrics(musicAudio.currentTime);
    updateFullscreenLyrics(musicAudio.currentTime);
  }
}

// ==================== 歌词功能 ====================
const musicLyricsContainer = document.getElementById('music-lyrics-container');
const musicLyrics = document.getElementById('music-lyrics');
const musicImportLrcBtn = document.getElementById('music-import-lrc-btn');
const musicLrcInput = document.getElementById('music-lrc-input');

// 导入歌词按钮点击
if (musicImportLrcBtn && musicLrcInput) {
  musicImportLrcBtn.addEventListener('click', function() {
    musicLrcInput.click();
  });
}

// 解析LRC歌词文件
function parseLRC(lrcText) {
  const lines = lrcText.split('
');
  const lyrics = [];
  
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  
  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3].padEnd(3, '0'));
      const text = match[4].trim();
      
      if (text) {
        const time = minutes * 60 + seconds + milliseconds / 1000;
        lyrics.push({ time, text });
      }
    }
  });
  
  return lyrics.sort((a, b) => a.time - b.time);
}

// 加载歌词
function loadLyrics(lyrics) {
  console.log('loadLyrics 被调用，歌词数量:', lyrics.length);
  console.log('musicLyrics 元素:', musicLyrics);
  currentLyrics = lyrics;
  currentLyricIndex = -1;
  
  if (!musicLyrics) {
    console.log('musicLyrics 未找到');
    return;
  }
  
  if (lyrics.length === 0) {
    const currentLyricLine = musicLyrics.querySelector('.current-lyric-line');
    const nextLyricLine = musicLyrics.querySelector('.next-lyric-line');
    if (currentLyricLine) currentLyricLine.textContent = '暂无歌词';
    if (nextLyricLine) nextLyricLine.textContent = '\u00A0'; // &nbsp; 的 Unicode
    return;
  }
  
  // 直接更新普通歌词显示区域
  const currentLyricLine = musicLyrics.querySelector('.current-lyric-line');
  const nextLyricLine = musicLyrics.querySelector('.next-lyric-line');
  
  console.log('普通歌词元素:', { currentLyricLine, nextLyricLine });
  console.log('要设置的歌词:', { first: lyrics[0], second: lyrics[1] });
  
  if (currentLyricLine && lyrics[0]) {
    currentLyricLine.textContent = lyrics[0].text;
    currentLyricLine.style.transition = 'all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
    currentLyricLine.style.color = 'var(--primary-blue)';
    currentLyricLine.style.fontSize = '16px';
    currentLyricLine.style.fontWeight = '600';
    currentLyricLine.style.opacity = '1';
    console.log('已设置当前歌词:', lyrics[0].text);
  } else {
    console.log('当前歌词设置失败:', { currentLyricLine: !!currentLyricLine, hasLyric: !!lyrics[0] });
  }
  
  if (nextLyricLine && lyrics[1]) {
    nextLyricLine.textContent = lyrics[1].text;
    nextLyricLine.style.transition = 'all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
    nextLyricLine.style.color = 'var(--text-gray)';
    nextLyricLine.style.fontSize = '14px';
    nextLyricLine.style.fontWeight = '400';
    nextLyricLine.style.opacity = '0.6';
    console.log('已设置下一歌词:', lyrics[1].text);
  } else if (nextLyricLine) {
    nextLyricLine.textContent = '\u00A0'; // &nbsp; 的 Unicode
    console.log('已设置下一歌词为空白');
  } else {
    console.log('下一歌词元素未找到');
  }
  
  // 初始化显示第一行
  console.log('调用 updateLyrics(0)');
  updateLyrics(0);
}

// 更新歌词显示
function updateLyrics(currentTime) {
  if (currentLyrics.length === 0) {
    return;
  }
  
  // 找到当前播放的歌词
  let newIndex = -1;
  for (let i = 0; i < currentLyrics.length; i++) {
    if (currentLyrics[i].time <= currentTime) {
      newIndex = i;
    } else {
      break;
    }
  }
  // 如果没有找到匹配的歌词，使用第一个歌词
  if (newIndex < 0 && currentLyrics.length > 0) {
    newIndex = 0;
  }
  
  if (newIndex !== currentLyricIndex) {
    currentLyricIndex = newIndex;
    
    // 更新普通歌词显示区域
    if (musicLyrics) {
      const currentLyricLine = musicLyrics.querySelector('.current-lyric-line');
      const nextLyricLine = musicLyrics.querySelector('.next-lyric-line');
      
      if (currentLyricLine && currentLyrics[newIndex]) {
        // 更新当前歌词
        currentLyricLine.textContent = currentLyrics[newIndex].text;
        currentLyricLine.style.transition = 'all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
        currentLyricLine.style.color = 'var(--primary-blue)';
        currentLyricLine.style.fontSize = '16px';
        currentLyricLine.style.fontWeight = '600';
        currentLyricLine.style.opacity = '1';
      }
      
      // 查找下一行歌词
      if (nextLyricLine && currentLyrics[newIndex + 1]) {
        // 更新下一行歌词
        nextLyricLine.textContent = currentLyrics[newIndex + 1].text;
        nextLyricLine.style.transition = 'all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
        nextLyricLine.style.color = 'var(--text-gray)';
        nextLyricLine.style.fontSize = '14px';
        nextLyricLine.style.fontWeight = '400';
        nextLyricLine.style.opacity = '0.6';
      } else if (nextLyricLine) {
        // 如果没有下一行歌词，则显示空白
        nextLyricLine.textContent = '\u00A0'; // &nbsp; 的 Unicode
      }
    }
    
    // 更新全屏歌词显示区域
    updateFullscreenLyrics(currentTime);
  }
}

// 文件选择处理
if (musicLrcInput) {
  musicLrcInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const lrcText = event.target.result;
      const lyrics = parseLRC(lrcText);
      loadLyrics(lyrics);
      
      // 保存歌词到当前音乐
      if (currentMusicIndex >= 0 && musicPlaylist[currentMusicIndex]) {
        musicPlaylist[currentMusicIndex].lyrics = lyrics;
      }
      
      // 重置文件输入框，允许再次选择同一文件
      musicLrcInput.value = '';
    };
    reader.onerror = function() {
      console.error('[Lyrics] Failed to read file');
      // 重置文件输入框
      musicLrcInput.value = '';
    };
    reader.readAsText(file);
  });
}

// 在音频时间更新时同步歌词
if (musicAudio) {
  let lastMusicUIUpdate = 0;
  let lastLyricUpdate = 0;
  musicAudio.addEventListener('timeupdate', function() {
    const now = performance.now();
    const currentTime = musicAudio.currentTime;

    // 进度条/时间显示最多约4次/秒，避免音频事件频繁触发导致布局抖动。
    if (now - lastMusicUIUpdate >= 250) {
      lastMusicUIUpdate = now;
      if (musicProgressFill && musicAudio.duration) {
        const percent = (currentTime / musicAudio.duration) * 100;
        musicProgressFill.style.width = percent + '%';
      }
      if (musicCurrentTime) {
        musicCurrentTime.textContent = formatMusicTime(currentTime);
      }
      if (fullscreenCurrentTime && currentTime) {
        fullscreenCurrentTime.textContent = formatMusicTime(currentTime);
      }
      if (fullscreenDuration && musicAudio.duration) {
        fullscreenDuration.textContent = formatMusicTime(musicAudio.duration);
      }
    }

    // 歌词同步最多约10次/秒，兼顾流畅和功耗。
    if (now - lastLyricUpdate >= 100) {
      lastLyricUpdate = now;
      updateLyrics(currentTime);
    }
  });
}

// 播放音乐时加载对应歌词 - 使用函数包装避免提前引用
function createPlayMusicWithLyrics() {
  const originalPlayMusic = playMusic;
  return function(index) {
    originalPlayMusic(index);
    
    // 加载该歌曲的歌词
    if (musicPlaylist && musicPlaylist[index] && musicPlaylist[index].lyrics) {
      loadLyrics(musicPlaylist[index].lyrics);
    } else {
      loadLyrics([]);
      if (musicLyrics) {
        // 更新现有的歌词元素而不是替换整个容器
        const currentLyricLine = musicLyrics.querySelector('.current-lyric-line');
        const nextLyricLine = musicLyrics.querySelector('.next-lyric-line');
        
        if (currentLyricLine) {
          currentLyricLine.textContent = '暂无歌词，点击导入歌词';
          currentLyricLine.style.color = 'var(--text-gray)';
          currentLyricLine.style.fontSize = '14px';
          currentLyricLine.style.fontWeight = 'normal';
          currentLyricLine.style.opacity = '1';
        }
        
        if (nextLyricLine) {
          nextLyricLine.textContent = '\u00A0'; // &nbsp; 的 Unicode
          nextLyricLine.style.display = 'none'; // 隐藏下一行
        }
      }
    }
  };
}

// 覆盖playMusic函数
playMusic = createPlayMusicWithLyrics();

// 歌词变量（在 DOMContentLoaded 内部定义）
let currentLyrics = [];
let currentLyricIndex = -1;
}); // 结束 DOMContentLoaded

// ==================== Safari浏览器功能 ====================
let safariHistory = [];
let safariHistoryIndex = -1;
let safariBookmarks = JSON.parse(localStorage.getItem('safariBookmarks') || '[{"url":"https://www.baidu.com","title":"百度"},{"url":"https://www.bing.com","title":"必应"},{"url":"https://www.google.com","title":"Google"}]');

// 处理地址栏输入
function handleSafariInput(event) {
  if (event.key === 'Enter') {
    const input = event.target;
    let url = input.value.trim();
    if (!url) return;
    
    // 如果没有协议，添加 https://
    if (!url.match(/^https?:\/\//i) && !url.match(/^ftp:\/\//i)) {
      // 如果是搜索关键词，使用百度
      if (!url.match(/\.[a-z]{2,}$/i) || url.includes(' ')) {
        url = 'https://www.baidu.com/s?wd=' + encodeURIComponent(url);
      } else {
        url = 'https://' + url;
      }
    }
    
    openUrl(url);
  }
}

// 打开URL
function openUrl(url) {
  const iframe = document.getElementById('safari-iframe');
  const home = document.getElementById('safari-home');
  const urlInput = document.getElementById('safari-url-input');
  
  // 显示iframe，隐藏主页
  iframe.classList.add('active');
  home.classList.add('hidden');
  
  // 设置iframe源
  iframe.src = url;
  urlInput.value = url;
  
  // 添加到历史记录
  addToHistory(url, url);
  
  // 更新导航按钮状态
  updateSafariNavButtons();
}

// 后退
function safariGoBack() {
  if (safariHistoryIndex > 0) {
    safariHistoryIndex--;
    const historyItem = safariHistory[safariHistoryIndex];
    if (historyItem) {
      const iframe = document.getElementById('safari-iframe');
      const urlInput = document.getElementById('safari-url-input');
      iframe.src = historyItem.url;
      urlInput.value = historyItem.url;
      updateSafariNavButtons();
    }
  }
}

// 前进
function safariGoForward() {
  if (safariHistoryIndex < safariHistory.length - 1) {
    safariHistoryIndex++;
    const historyItem = safariHistory[safariHistoryIndex];
    if (historyItem) {
      const iframe = document.getElementById('safari-iframe');
      const urlInput = document.getElementById('safari-url-input');
      iframe.src = historyItem.url;
      urlInput.value = historyItem.url;
      updateSafariNavButtons();
    }
  }
}

// 刷新
function safariReload() {
  const iframe = document.getElementById('safari-iframe');
  if (iframe.src) {
    iframe.src = iframe.src;
  }
}

// 更新导航按钮状态
function updateSafariNavButtons() {
  const backBtn = document.getElementById('safari-back');
  const forwardBtn = document.getElementById('safari-forward');
  
  // 这里简化处理，实际应该监听iframe的加载事件
  backBtn.classList.toggle('active', safariHistoryIndex > 0);
  forwardBtn.classList.toggle('active', safariHistoryIndex < safariHistory.length - 1);
}

// 添加到历史记录
function addToHistory(url, title) {
  // 如果当前URL和上一个相同，不添加
  if (safariHistoryIndex >= 0 && safariHistory[safariHistoryIndex] && safariHistory[safariHistoryIndex].url === url) {
    return;
  }
  
  // 移除当前位置之后的历史记录
  safariHistory = safariHistory.slice(0, safariHistoryIndex + 1);
  
  // 添加新记录
  safariHistory.push({ url, title, time: new Date() });
  safariHistoryIndex++;
  
  // 限制历史记录数量
  if (safariHistory.length > 100) {
    safariHistory.shift();
    safariHistoryIndex--;
  }
  
  // 保存到localStorage
  localStorage.setItem('safariHistory', JSON.stringify(safariHistory));
  
  // 更新历史记录页面
  updateHistoryList();
}

// 更新历史记录列表
function updateHistoryList() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;
  
  if (safariHistory.length === 0) {
    historyList.innerHTML = '<div class="item" style="justify-content: center; color: var(--text-gray);"><div class="item-text">暂无历史记录</div></div>';
    return;
  }
  
  historyList.innerHTML = safariHistory.slice().reverse().map(item => {
    const time = new Date(item.time);
    const timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const domain = item.url.replace(/^https?:\/\//, '').split('/')[0];
    return `<div class="item" onclick="openBookmark('${item.url}', '${item.title}')">
      <div class="item-icon" style="background: var(--primary-blue);">${domain.charAt(0).toUpperCase()}</div>
      <div class="item-text">${item.title || domain}</div>
      <div class="item-desc">${timeStr}</div>
    </div>`;
  }).join('');
}

// 显示书签页面
function showBookmarks() {
  const bookmarksSubpage = document.getElementById('subpage-bookmarks');
  if (bookmarksSubpage) {
    bookmarksSubpage.classList.add('show');
    updateBookmarksList();
  }
}

// 显示历史记录页面
function showHistory() {
  const historySubpage = document.getElementById('subpage-history');
  if (historySubpage) {
    historySubpage.classList.add('show');
    updateHistoryList();
  }
}

// 更新书签列表
function updateBookmarksList() {
  const bookmarksList = document.getElementById('bookmarks-list');
  if (!bookmarksList) return;
  
  bookmarksList.innerHTML = safariBookmarks.map(bookmark => {
    const domain = bookmark.url.replace(/^https?:\/\//, '').split('/')[0];
    const initial = bookmark.title ? bookmark.title.charAt(0) : domain.charAt(0);
    const colors = ['#2932E1', '#008373', '#4285F4', '#FF9500', '#FF2D55', '#5856D6', '#FF3B30', '#34C759'];
    const color = colors[Math.abs(bookmark.url.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % colors.length];
    return `<div class="item" onclick="openBookmark('${bookmark.url}', '${bookmark.title}')">
      <div class="item-icon" style="background: ${color};">${initial}</div>
      <div class="item-text">${bookmark.title}</div>
      <div class="item-arrow">></div>
    </div>`;
  }).join('');
}

// 打开书签
function openBookmark(url, title) {
  // 返回浏览器页面
  goBack();
  
  // 打开URL
  setTimeout(() => {
    openUrl(url);
  }, 300);
}

// 添加书签
function addBookmark() {
  const iframe = document.getElementById('safari-iframe');
  const urlInput = document.getElementById('safari-url-input');
  
  if (!iframe.classList.contains('active')) {
    showNotification('请先打开一个网页');
    return;
  }
  
  const url = iframe.src || urlInput.value;
  const title = url.replace(/^https?:\/\//, '').split('/')[0];
  
  // 检查是否已存在
  const exists = safariBookmarks.some(b => b.url === url);
  if (exists) {
    showNotification('该网页已在书签中');
    return;
  }
  
  safariBookmarks.push({ url, title });
  localStorage.setItem('safariBookmarks', JSON.stringify(safariBookmarks));
  showNotification('已添加到书签');
}

// 清除历史记录
function clearHistory() {
  safariHistory = [];
  safariHistoryIndex = -1;
  localStorage.removeItem('safariHistory');
  updateHistoryList();
  showNotification('历史记录已清除');
}

// 分享页面
function sharePage() {
  const iframe = document.getElementById('safari-iframe');
  if (!iframe.classList.contains('active')) {
    showNotification('请先打开一个网页');
    return;
  }
  
  const url = iframe.src;
  
  // 复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showNotification('链接已复制到剪贴板');
    }).catch(() => {
      showNotification('复制失败');
    });
  } else {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('链接已复制到剪贴板');
  }
}

// 显示Safari菜单
function showSafariMenu() {
  // 可以扩展为显示更多选项
  showNotification('浏览器菜单');
}

// 显示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 99999;
    animation: fadeIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// 初始化浏览器
function initSafari() {
  // 加载历史记录
  const savedHistory = localStorage.getItem('safariHistory');
  if (savedHistory) {
    safariHistory = JSON.parse(savedHistory);
    safariHistoryIndex = safariHistory.length - 1;
  }
  
  // 更新历史记录列表
  updateHistoryList();
  
  // 监听iframe加载事件
  const iframe = document.getElementById('safari-iframe');
  if (iframe) {
    iframe.addEventListener('load', function() {
      try {
        const url = iframe.contentWindow.location.href;
        const title = iframe.contentWindow.document.title || url;
        document.getElementById('safari-url-input').value = url;
        addToHistory(url, title);
      } catch (e) {
        // 跨域限制，无法获取
      }
    });
  }
}

// 页面加载完成后初始化浏览器
document.addEventListener('DOMContentLoaded', function() {
  initSafari();
});

// 将函数暴露到全局
window.handleSafariInput = handleSafariInput;
window.openUrl = openUrl;
window.safariGoBack = safariGoBack;
window.safariGoForward = safariGoForward;
window.safariReload = safariReload;
window.showBookmarks = showBookmarks;
window.showHistory = showHistory;
window.openBookmark = openBookmark;
window.addBookmark = addBookmark;
window.clearHistory = clearHistory;
window.sharePage = sharePage;
window.showSafariMenu = showSafariMenu;

// ==================== 开发者选项功能 ====================
let isDebugMode = localStorage.getItem('debugMode') === 'true';
let isFPSDisplayEnabled = localStorage.getItem('fpsDisplay') === 'true';
let isPerformanceMetricsEnabled = localStorage.getItem('performanceMetrics') === 'true';

// 开发者选项密码保护
// 密码 "ThinkReally331813" 的 Unicode 加密形式
const DEVELOPER_PASSWORD_ENCRYPTED = [84, 104, 105, 110, 107, 82, 101, 97, 108, 108, 121, 51, 51, 49, 56, 49, 51];
let isDeveloperAuthenticated = localStorage.getItem('developerAuthenticated') === 'true';
let developerPasswordAttempts = 0;
const MAX_PASSWORD_ATTEMPTS = 5;

// FPS显示元素
let fpsDisplayElement = null;
let fpsFrameHistory = [];
let fpsLastTime = 0;
let fpsAnimationId = null;

// 性能监测变量
let performanceMetrics = {
  cpuUsage: 0,
  gpuUsage: 0,
  localTick: 0,
  networkLatency: 0,
  lastFrameTime: 0,
  frameTimeHistory: [],
  cpuHistory: [],
  networkHistory: []
};

// 网络延迟监测
let networkLatencyInterval = null;

// 初始化开发者选项
function initDeveloperOptions() {
  console.log('[Developer] initDeveloperOptions called');
  // 恢复开关状态
  updateDeveloperSwitches();

  // 如果开启了FPS显示，启动它
  if (isFPSDisplayEnabled) {
    console.log('[Developer] FPS display enabled, starting...');
    startFPSDisplay();
  }

  // 如果开启了调试模式，添加调试钩子
  if (isDebugMode) {
    enableDebugMode();
  }
}

// 验证开发者密码
function verifyDeveloperPassword(inputPassword) {
  // 将输入的密码转换为 Unicode 数组
  const inputUnicode = Array.from(inputPassword).map(char => char.charCodeAt(0));

  // 比较加密后的密码
  if (inputUnicode.length !== DEVELOPER_PASSWORD_ENCRYPTED.length) {
    return false;
  }

  for (let i = 0; i < DEVELOPER_PASSWORD_ENCRYPTED.length; i++) {
    if (inputUnicode[i] !== DEVELOPER_PASSWORD_ENCRYPTED[i]) {
      return false;
    }
  }

  return true;
}

// 打开开发者选项（带密码验证）
function openDeveloperOptions() {
  // 如果已经验证过，直接打开
  if (isDeveloperAuthenticated) {
    showDeveloperPage();
    return;
  }

  // 检查尝试次数
  if (developerPasswordAttempts >= MAX_PASSWORD_ATTEMPTS) {
    showNotification('密码尝试次数过多，请稍后重试');
    return;
  }

  // 显示密码输入对话框
  showPasswordDialog();
}

// 显示开发者选项页面
function showDeveloperPage() {
  const targetSubpage = document.getElementById('subpage-setting-developer');
  const currentPage = document.querySelector('.page.show');

  if (!targetSubpage || !currentPage) return;

  currentPage.classList.add('slide-left');
  void targetSubpage.offsetWidth;
  targetSubpage.classList.add('show');

  console.log('[Navigation] Developer page opened, updating switches');
  updateDeveloperSwitches();
}

// 显示密码输入对话框
function showPasswordDialog() {
  // 创建密码对话框
  const dialog = document.createElement('div');
  dialog.id = 'developer-password-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  dialog.innerHTML = `
    <div style="
      background: var(--white);
      border-radius: 16px;
      padding: 24px;
      width: 80%;
      max-width: 300px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    ">
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; text-align: center; color: var(--text-primary);">开发者验证</div>
      <div style="font-size: 13px; color: var(--text-gray); margin-bottom: 20px; text-align: center;">请输入开发者密码</div>
      <input type="password" id="developer-password-input" placeholder="密码" style="
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--line-gray);
        border-radius: 10px;
        font-size: 16px;
        margin-bottom: 16px;
        background: var(--bg-gray);
        color: var(--text-primary);
        outline: none;
        box-sizing: border-box;
      ">
      <div style="display: flex; gap: 12px;">
        <button onclick="closePasswordDialog()" style="
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: var(--bg-gray);
          color: var(--text-primary);
          font-size: 16px;
          cursor: pointer;
          font-weight: 500;
        ">取消</button>
        <button onclick="submitDeveloperPassword()" style="
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: var(--primary-blue);
          color: white;
          font-size: 16px;
          cursor: pointer;
          font-weight: 500;
        ">确认</button>
      </div>
      <div id="password-error" style="color: #FF3B30; font-size: 12px; text-align: center; margin-top: 12px; display: none;">密码错误</div>
    </div>
  `;

  document.body.appendChild(dialog);

  // 动画显示
  requestAnimationFrame(() => {
    dialog.style.opacity = '1';
    dialog.querySelector('div > div').style.transform = 'scale(1)';
  });

  // 聚焦输入框
  setTimeout(() => {
    const input = document.getElementById('developer-password-input');
    if (input) input.focus();
  }, 100);

  // 添加回车键提交
  const input = document.getElementById('developer-password-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitDeveloperPassword();
      }
    });
  }
}

// 关闭密码对话框
function closePasswordDialog() {
  const dialog = document.getElementById('developer-password-dialog');
  if (dialog) {
    dialog.style.opacity = '0';
    dialog.querySelector('div > div').style.transform = 'scale(0.9)';
    setTimeout(() => dialog.remove(), 300);
  }
}

// 提交密码验证
function submitDeveloperPassword() {
  const input = document.getElementById('developer-password-input');
  const errorDiv = document.getElementById('password-error');

  if (!input) return;

  const password = input.value.trim();

  if (!password) {
    if (errorDiv) {
      errorDiv.textContent = '请输入密码';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (verifyDeveloperPassword(password)) {
    // 验证成功
    isDeveloperAuthenticated = true;
    localStorage.setItem('developerAuthenticated', 'true');
    developerPasswordAttempts = 0;
    closePasswordDialog();
    showNotification('验证成功');
    showDeveloperPage();
  } else {
    // 验证失败
    developerPasswordAttempts++;
    const remainingAttempts = MAX_PASSWORD_ATTEMPTS - developerPasswordAttempts;

    if (errorDiv) {
      errorDiv.textContent = `密码错误，还剩 ${remainingAttempts} 次机会`;
      errorDiv.style.display = 'block';
    }

    // 清空输入框
    input.value = '';
    input.focus();

    // 如果超过最大尝试次数
    if (developerPasswordAttempts >= MAX_PASSWORD_ATTEMPTS) {
      closePasswordDialog();
      showNotification('密码尝试次数过多，请稍后重试');

      // 5分钟后重置尝试次数
      setTimeout(() => {
        developerPasswordAttempts = 0;
      }, 5 * 60 * 1000);
    }
  }
}

// 切换跳过开机动画
function toggleBootSkip() {
  const bootSkipSwitch = document.getElementById('boot-skip-switch');
  if (!bootSkipSwitch) return;
  const isActive = bootSkipSwitch.classList.contains('active');
  if (isActive) {
    bootSkipSwitch.classList.remove('active');
    localStorage.setItem('bootSkip', 'false');
    console.log('开机动画跳过已关闭');
    showNotification('开机动画跳过已关闭');
  } else {
    bootSkipSwitch.classList.add('active');
    localStorage.setItem('bootSkip', 'true');
    console.log('开机动画跳过已开启');
    showNotification('开机动画跳过已开启');
  }
}

// 更新开发者选项开关状态
function updateDeveloperSwitches() {
  const debugSwitch = document.querySelector('#developer-debug-switch .item-switch');
  const fpsSwitch = document.querySelector('#developer-fps-switch .item-switch');
  const performanceSwitch = document.querySelector('#developer-performance-switch .item-switch');
  const performanceGroup = document.getElementById('developer-performance-group');

  console.log('[Developer] updateDeveloperSwitches called:', {
    debugSwitch: !!debugSwitch,
    fpsSwitch: !!fpsSwitch,
    performanceSwitch: !!performanceSwitch,
    performanceGroup: !!performanceGroup,
    isDebugMode,
    isFPSDisplayEnabled,
    isPerformanceMetricsEnabled
  });

  if (debugSwitch) {
    debugSwitch.classList.toggle('active', isDebugMode);
  }
  if (fpsSwitch) {
    fpsSwitch.classList.toggle('active', isFPSDisplayEnabled);
  }
  const bootSkipSwitch = document.getElementById('boot-skip-switch');
  if (bootSkipSwitch) {
    const bootSkipEnabled = localStorage.getItem('bootSkip') !== 'false';
    bootSkipSwitch.classList.toggle('active', bootSkipEnabled);
  }

  if (performanceSwitch) {
    performanceSwitch.classList.toggle('active', isPerformanceMetricsEnabled);
  }

  // 性能参数组只有在FPS显示开启时才可用
  if (performanceGroup) {
    if (isFPSDisplayEnabled) {
      performanceGroup.style.opacity = '1';
      performanceGroup.style.pointerEvents = 'auto';
    } else {
      performanceGroup.style.opacity = '0.5';
      performanceGroup.style.pointerEvents = 'none';
      // 如果FPS关闭，也关闭性能参数
      if (isPerformanceMetricsEnabled) {
        isPerformanceMetricsEnabled = false;
        localStorage.setItem('performanceMetrics', 'false');
        if (performanceSwitch) {
          performanceSwitch.classList.remove('active');
        }
      }
    }
  }
}

// 切换调试模式
function toggleDebugMode() {
  isDebugMode = !isDebugMode;
  localStorage.setItem('debugMode', isDebugMode);
  updateDeveloperSwitches();
  
  if (isDebugMode) {
    enableDebugMode();
    showNotification('调试模式已开启');
  } else {
    disableDebugMode();
    showNotification('调试模式已关闭');
  }
}

// 启用调试模式
function enableDebugMode() {
  // 重写console.log以添加时间戳和更多信息
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  window.debugLog = function(...args) {
    const timestamp = new Date().toISOString();
    originalLog.apply(console, [`[DEBUG ${timestamp}]`, ...args]);
  };
  
  // 添加性能监控
  if (window.performance && performance.mark) {
    debugLog('性能监控已启用');
  }
  
  // 显示当前状态
  debugLog('调试模式状态:', {
    userAgent: navigator.userAgent,
    screenSize: `${screen.width}x${screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    memory: performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` : 'N/A'
  });
}

// 禁用调试模式
function disableDebugMode() {
  window.debugLog = function() {};
}

// 切换FPS显示
function toggleFPSDisplay() {
  console.log('[FPS] toggleFPSDisplay called, current state:', isFPSDisplayEnabled);
  isFPSDisplayEnabled = !isFPSDisplayEnabled;
  localStorage.setItem('fpsDisplay', isFPSDisplayEnabled);
  console.log('[FPS] New state:', isFPSDisplayEnabled);
  updateDeveloperSwitches();

  if (isFPSDisplayEnabled) {
    startFPSDisplay();
    showNotification('FPS显示已开启');
  } else {
    stopFPSDisplay();
    showNotification('FPS显示已关闭');
  }
}

// 切换性能参数显示
function togglePerformanceMetrics() {
  console.log('[Performance] togglePerformanceMetrics called, FPS enabled:', isFPSDisplayEnabled);
  if (!isFPSDisplayEnabled) {
    showNotification('请先开启FPS显示');
    return;
  }

  isPerformanceMetricsEnabled = !isPerformanceMetricsEnabled;
  localStorage.setItem('performanceMetrics', isPerformanceMetricsEnabled);
  console.log('[Performance] New state:', isPerformanceMetricsEnabled);
  updateDeveloperSwitches();

  if (isPerformanceMetricsEnabled) {
    showNotification('性能参数已开启');
  } else {
    showNotification('性能参数已关闭');
  }
}

// 启动FPS显示
function startFPSDisplay() {
  console.log('[FPS] startFPSDisplay called');
  if (fpsDisplayElement) {
    fpsDisplayElement.style.display = 'block';
    console.log('[FPS] Existing element shown');
  } else {
    createFPSDisplay();
    console.log('[FPS] New element created');
  }

  fpsFrameHistory = [];
  fpsLastTime = 0; // 重置为0，让updateFPS在首次运行时设置正确的时间
  updateFPS();
}

// 停止FPS显示
function stopFPSDisplay() {
  if (fpsDisplayElement) {
    fpsDisplayElement.style.display = 'none';
  }
  if (fpsAnimationId) {
    cancelAnimationFrame(fpsAnimationId);
    fpsAnimationId = null;
  }
}

// 创建FPS显示元素
function createFPSDisplay() {
  fpsDisplayElement = document.createElement('div');
  fpsDisplayElement.id = 'fps-display';
  fpsDisplayElement.style.cssText = `
    position: fixed;
    bottom: calc(var(--safe-bottom) + 10px);
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00FF00;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'SF Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    z-index: 99999;
    pointer-events: none;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    min-width: 80px;
    text-align: right;
    line-height: 1.4;
  `;
  document.body.appendChild(fpsDisplayElement);
}

// 更新FPS显示
let lastFPSDomUpdate = 0;
let lastFPSHeavyCalc = 0;
let cachedFPSDisplayText = '';

function updateFPS() {
  if (!isFPSDisplayEnabled || document.hidden) {
    fpsAnimationId = null;
    return;
  }

  const now = performance.now();

  // 首次运行或长时间未更新时，重置时间基准
  if (fpsLastTime === 0) {
    fpsLastTime = now;
    fpsAnimationId = requestAnimationFrame(updateFPS);
    return;
  }

  const delta = now - fpsLastTime;
  fpsLastTime = now;

  // 计算当前FPS
  const currentFPS = Math.round(1000 / delta);

  // 添加到历史记录（保留最近10秒的数据，降低统计计算和内存压力）
  fpsFrameHistory.push({
    fps: currentFPS,
    time: now,
    frameTime: delta
  });
  
  // 清理超过10秒的数据，且最多每500ms清理一次。
  if (now - lastFPSHeavyCalc > 500) {
    const tenSecondsAgo = now - 10000;
    fpsFrameHistory = fpsFrameHistory.filter(f => f.time > tenSecondsAgo);
    lastFPSHeavyCalc = now;
  }
  
  // 更新显示：DOM 最多每250ms更新一次，避免每帧 innerHTML。
  if (fpsDisplayElement && now - lastFPSDomUpdate >= 250) {
    lastFPSDomUpdate = now;
    // 计算3秒平均帧（基于最近3秒的帧数据）
    const threeSecondsAgo = now - 3000;
    const recentFrames = fpsFrameHistory.filter(f => f.time > threeSecondsAgo);
    let avg3sFPS = currentFPS;
    if (recentFrames.length > 0) {
      const avgFrameTime3s = recentFrames.reduce((a, b) => a + b.frameTime, 0) / recentFrames.length;
      avg3sFPS = Math.round(1000 / avgFrameTime3s);
    }
    let displayText = `${currentFPS} FPS`;
    displayText += `<br><span style="font-size: 10px; color: #00AAFF;">3sAvg: ${avg3sFPS}</span>`;
    
    // 如果开启了性能参数，计算并显示更多数据
    if (isPerformanceMetricsEnabled && fpsFrameHistory.length > 0) {
      const frameTimes = fpsFrameHistory.map(f => f.frameTime);
      
      // 计算平均帧率
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const avgFPS = Math.round(1000 / avgFrameTime);
      
      // 计算1% Low帧（最差的1%帧时间的平均）
      const sortedFrameTimes = [...frameTimes].sort((a, b) => b - a);
      const onePercentCount = Math.max(1, Math.ceil(sortedFrameTimes.length * 0.01));
      const onePercentLowTimes = sortedFrameTimes.slice(0, onePercentCount);
      const onePercentLowAvg = onePercentLowTimes.reduce((a, b) => a + b, 0) / onePercentLowTimes.length;
      const onePercentLowFPS = Math.round(1000 / onePercentLowAvg);
      
      displayText += `<br><span style="font-size: 10px; color: #FFFF00;">Avg: ${avgFPS}</span>`;
      displayText += `<br><span style="font-size: 10px; color: #FF6B6B;">1%Low: ${onePercentLowFPS}</span>`;
      
      // 更新性能监测数据
      updatePerformanceMetrics(delta);
      
      // 显示CPU占用率（基于帧时间波动估算）
      const cpuUsage = calculateCPUUsage();
      displayText += `<br><span style="font-size: 10px; color: #00BFFF;">CPU: ${cpuUsage}%</span>`;
      
      // 显示GPU占用率（基于渲染性能估算）
      const gpuUsage = calculateGPUUsage();
      displayText += `<br><span style="font-size: 10px; color: #FF00FF;">GPU: ${gpuUsage}%</span>`;
      
      // 显示本地Tick（帧处理时间）
      const localTick = Math.round(delta);
      displayText += `<br><span style="font-size: 10px; color: #00FF00;">Tick: ${localTick}ms</span>`;
      
      // 显示网络延迟
      const networkLatency = performanceMetrics.networkLatency;
      const latencyColor = networkLatency < 50 ? '#00FF00' : networkLatency < 100 ? '#FFFF00' : '#FF6B6B';
      displayText += `<br><span style="font-size: 10px; color: ${latencyColor};">Net: ${networkLatency}ms</span>`;
    }
    
    if (displayText !== cachedFPSDisplayText) {
      cachedFPSDisplayText = displayText;
      fpsDisplayElement.innerHTML = displayText;
    }
  }
  
  // 调试日志
  if (isDebugMode && fpsFrameHistory.length % 60 === 0) {
    debugLog('FPS Stats:', {
      current: currentFPS,
      historyLength: fpsFrameHistory.length,
      avgFrameTime: fpsFrameHistory.reduce((a, b) => a + b.frameTime, 0) / fpsFrameHistory.length
    });
  }
  
  fpsAnimationId = requestAnimationFrame(updateFPS);
}

// 页面加载完成后初始化开发者选项
document.addEventListener('DOMContentLoaded', function() {
  initDeveloperOptions();
});

// 将函数暴露到全局
window.toggleDebugMode = toggleDebugMode;
window.toggleFPSDisplay = toggleFPSDisplay;
// togglePerformanceMetrics 将在下面被覆盖以添加网络监测功能
window.initDeveloperOptions = initDeveloperOptions;

// 暴露开发者选项密码保护函数到全局
window.openDeveloperOptions = openDeveloperOptions;
window.toggleBootSkip = toggleBootSkip;
window.showDeveloperPage = showDeveloperPage;
window.showPasswordDialog = showPasswordDialog;
window.closePasswordDialog = closePasswordDialog;
window.submitDeveloperPassword = submitDeveloperPassword;
window.verifyDeveloperPassword = verifyDeveloperPassword;

// ==================== 性能监测功能 ====================

// 更新性能监测数据
function updatePerformanceMetrics(frameTime) {
  const now = performance.now();
  performanceMetrics.lastFrameTime = frameTime;
  performanceMetrics.localTick = frameTime;
  
  // 记录帧时间历史
  performanceMetrics.frameTimeHistory.push({
    time: now,
    frameTime: frameTime
  });
  
  // 清理超过5秒的数据
  const fiveSecondsAgo = now - 5000;
  performanceMetrics.frameTimeHistory = performanceMetrics.frameTimeHistory.filter(f => f.time > fiveSecondsAgo);
}

// 计算CPU占用率（基于帧时间波动和主线程占用估算）
function calculateCPUUsage() {
  const history = performanceMetrics.frameTimeHistory;
  if (history.length < 10) return 0;
  
  // 计算帧时间的标准差和平均值
  const frameTimes = history.map(h => h.frameTime);
  const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const variance = frameTimes.reduce((sum, ft) => sum + Math.pow(ft - avg, 2), 0) / frameTimes.length;
  const stdDev = Math.sqrt(variance);
  
  // 基于帧时间波动估算CPU占用率
  // 如果帧时间波动大，说明CPU占用高
  const targetFrameTime = 1000 / 60; // 60fps = 16.67ms
  const cpuEstimate = Math.min(100, Math.round((avg / targetFrameTime) * 60 + (stdDev * 2)));
  
  // 平滑处理
  performanceMetrics.cpuHistory.push(cpuEstimate);
  if (performanceMetrics.cpuHistory.length > 10) {
    performanceMetrics.cpuHistory.shift();
  }
  
  return Math.round(performanceMetrics.cpuHistory.reduce((a, b) => a + b, 0) / performanceMetrics.cpuHistory.length);
}

// 计算GPU占用率（基于渲染性能和帧率稳定性估算）
function calculateGPUUsage() {
  const history = performanceMetrics.frameTimeHistory;
  if (history.length < 10) return 0;
  
  // 基于帧率稳定性和渲染时间估算GPU占用
  const frameTimes = history.map(h => h.frameTime);
  const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const min = Math.min(...frameTimes);
  
  // 如果平均帧时间接近最小帧时间，说明GPU渲染效率高
  // 如果差距大，说明GPU负载重
  const targetFrameTime = 1000 / 60;
  const gpuEfficiency = min / avg;
  const gpuEstimate = Math.min(100, Math.round((1 - gpuEfficiency) * 100 + (avg > targetFrameTime ? (avg - targetFrameTime) * 2 : 0)));
  
  return gpuEstimate;
}

// 测量网络延迟
function measureNetworkLatency() {
  if (document.hidden) return;
  const startTime = performance.now();
  
  // 使用fetch请求当前页面或一个小的资源来测量延迟
  fetch(window.location.href, { 
    method: 'HEAD', 
    cache: 'no-store',
    mode: 'no-cors'
  }).then(() => {
    const latency = Math.round(performance.now() - startTime);
    performanceMetrics.networkLatency = latency;
    performanceMetrics.networkHistory.push(latency);
    
    // 保留最近10个测量值
    if (performanceMetrics.networkHistory.length > 10) {
      performanceMetrics.networkHistory.shift();
    }
  }).catch(() => {
    // 如果fetch失败，使用一个估算值
    performanceMetrics.networkLatency = Math.round(Math.random() * 20 + 10);
  });
}

// 启动网络延迟监测
function startNetworkLatencyMonitoring() {
  if (networkLatencyInterval) return;
  
  // 立即测量一次
  measureNetworkLatency();
  
  // 每10秒测量一次，减少网络与电量消耗。
  networkLatencyInterval = setInterval(measureNetworkLatency, 10000);
}

// 停止网络延迟监测
function stopNetworkLatencyMonitoring() {
  if (networkLatencyInterval) {
    clearInterval(networkLatencyInterval);
    networkLatencyInterval = null;
  }
}

// 在切换性能参数时启动/停止网络监测
const originalTogglePerformanceMetrics = togglePerformanceMetrics;
window.togglePerformanceMetrics = function() {
  originalTogglePerformanceMetrics();
  
  if (isPerformanceMetricsEnabled) {
    startNetworkLatencyMonitoring();
  } else {
    stopNetworkLatencyMonitoring();
  }
};

// 将性能监测函数暴露到全局
window.updatePerformanceMetrics = updatePerformanceMetrics;
window.calculateCPUUsage = calculateCPUUsage;
window.calculateGPUUsage = calculateGPUUsage;
window.measureNetworkLatency = measureNetworkLatency;

// ==================== 背景图API配置 ====================
// 外部背景服务接入配置
window.TEXT_CONFIG = {
    backgroundApi: 'https://img.399520.xyz'
};

// 背景图核心逻辑 - 对 img.399520.xyz 的特殊处理
(function() {
    const originalBackgroundApi = window.TEXT_CONFIG.backgroundApi;
    if (originalBackgroundApi && originalBackgroundApi.includes('img.399520.xyz')) {
        const width = 1600;
        const height = 900;
        const randomId = Math.floor(Math.random() * 1000);
        window.TEXT_CONFIG.backgroundApi = originalBackgroundApi + '/' + width + '/' + height + '?random=' + randomId + '&_t=' + Date.now();
    }
})();

