document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    let originalFile = null;

    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    // 处理拖放上传
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    // 处理点击上传
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // 处理图片文件
    function handleFile(file) {
        if (!file.type.match(/image\/(jpeg|png)/i)) {
            alert('请上传JPG或PNG格式的图片！');
            return;
        }

        originalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalSize.textContent = formatFileSize(file.size);
            previewContainer.style.display = 'block';
            compressImage();
        };
        reader.readAsDataURL(file);
    }

    // 添加防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 优化压缩图片函数
    function compressImage() {
        const quality = qualitySlider.value / 100;
        const img = new Image();
        img.src = originalPreview.src;
        
        // 添加加载提示
        compressedSize.textContent = '压缩中...';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 计算新的尺寸，保持宽高比
            let { width, height } = img;
            let targetWidth = width;
            let targetHeight = height;

            // 根据图片大小决定是否需要调整尺寸
            const maxSize = 1920;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    targetHeight = Math.round((height * maxSize) / width);
                    targetWidth = maxSize;
                } else {
                    targetWidth = Math.round((width * maxSize) / height);
                    targetHeight = maxSize;
                }
            }

            // 优化压缩质量设置
            let compressionQuality = quality;
            const fileSize = originalFile.size;
            
            // 根据文件大小动态调整压缩质量
            if (fileSize > 5 * 1024 * 1024) { // 大于5MB
                compressionQuality = Math.min(quality, 0.6);
            } else if (fileSize > 2 * 1024 * 1024) { // 大于2MB
                compressionQuality = Math.min(quality, 0.7);
            } else if (fileSize > 1024 * 1024) { // 大于1MB
                compressionQuality = Math.min(quality, 0.8);
            }

            // 设置canvas尺寸
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 在canvas上绘制调整后的图片
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // 使用Promise包装压缩过程
            new Promise((resolve) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        }
                    },
                    originalFile.type,
                    compressionQuality
                );
            }).then((blob) => {
                const url = URL.createObjectURL(blob);
                compressedPreview.src = url;
                
                // 显示压缩比例
                const ratio = ((1 - blob.size / originalFile.size) * 100).toFixed(1);
                compressedSize.textContent = `${formatFileSize(blob.size)} (压缩率: ${ratio}%)`;

                // 如果压缩效果不理想，自动调整质量
                if (blob.size >= originalFile.size && compressionQuality > 0.1) {
                    const newQuality = Math.max(0.1, compressionQuality - 0.1);
                    qualitySlider.value = Math.round(newQuality * 100);
                    qualityValue.textContent = qualitySlider.value + '%';
                    compressImage();
                }
            });
        };
    }

    // 使用防抖处理滑块事件
    const debouncedCompress = debounce(() => {
        compressImage();
    }, 300);

    // 质量滑块控制
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
        debouncedCompress();
    });

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `compressed_${originalFile.name}`;
        link.href = compressedPreview.src;
        link.click();
    });

    // 文件大小格式化
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 主题切换功能
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = {
        home: document.querySelector('.home-content'),
        compressor: document.querySelector('.compressor-content')
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有导航项的激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            // 添加当前导航项的激活状态
            item.classList.add('active');

            // 隐藏所有内容
            Object.values(contentSections).forEach(section => section.style.display = 'none');
            // 显示当前选中的内容
            const target = item.getAttribute('data-target');
            if (contentSections[target]) {
                contentSections[target].style.display = 'block';
            }
        });
    });

    // 初始化显示首页内容
    contentSections.home.style.display = 'block';
}); 