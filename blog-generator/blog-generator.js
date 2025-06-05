class BlogGeneratorUI {
    constructor() {
        this.currentStep = 1;
        this.formData = {};
        this.uploadedImages = [];
        this.generatedContent = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeImageUpload();
        
        setTimeout(() => this.initializeCharacterCounters(), 100);
    }

    bindEvents() {
        const generateForm = document.getElementById('blog-generator-form');
        console.log('bindEvents: generateForm found:', !!generateForm);
        if (generateForm) {
            console.log('bindEvents: Adding submit event listener');
            generateForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const previewForm = document.getElementById('preview-form');
        if (previewForm) {
            previewForm.addEventListener('submit', (e) => this.handlePreviewSubmit(e));
        }

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => this.goBack());
        }

        const authorizeButton = document.getElementById('authorize-button');
        if (authorizeButton) {
            authorizeButton.addEventListener('click', (e) => this.handlePreviewSubmit(e));
        }

        const validateJsonBtn = document.getElementById('validate-json');
        const formatJsonBtn = document.getElementById('format-json');
        
        if (validateJsonBtn) {
            validateJsonBtn.addEventListener('click', () => this.validateJson());
        }
        
        if (formatJsonBtn) {
            formatJsonBtn.addEventListener('click', () => this.formatJson());
        }

        this.bindPublishEvents();

        this.bindCharacterCounters();
    }

    bindCharacterCounters() {
        const titleInput = document.getElementById('preview-title');
        const descInput = document.getElementById('preview-meta-description');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.updateCharCounter('title-counter', titleInput.value.length);
            });
        }
        
        if (descInput) {
            descInput.addEventListener('input', () => {
                this.updateCharCounter('description-counter', descInput.value.length);
            });
        }
    }

    updateCharCounter(counterId, length) {
        const counter = document.getElementById(counterId);
        if (counter) {
            counter.textContent = length;
        }
    }

    initializeImageUpload() {
        const imageInputs = document.querySelectorAll('.image-input');
        imageInputs.forEach((input, index) => {
            input.addEventListener('change', (e) => this.handleImageUpload(e, index + 1));
        });
    }

    handleImageUpload(event, imageNumber) {
        const file = event.target.files[0];

        if (file) {
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                this.showImageError('PNG または JPEG 形式の画像を選択してください。');
                event.target.value = '';
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                this.showImageProcessing(imageNumber, 'ファイルサイズが大きいため、自動圧縮中...');
                this.compressImage(file, imageNumber, event.target);
            } else {
                this.processImageFile(file, imageNumber, event.target);
            }
        }
    }

    async compressImage(file, imageNumber, inputElement) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                let { width, height } = this.calculateOptimalDimensions(img.width, img.height);
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        
                        const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
                        this.showCompressionSuccess(imageNumber, file.size, compressedFile.size, compressionRatio);
                        this.processImageFile(compressedFile, imageNumber, inputElement);
                    } else {
                        this.showImageError('画像の圧縮に失敗しました。');
                    }
                }, file.type, 0.8);
            };
            
            img.onerror = () => {
                this.showImageError('画像の読み込みに失敗しました。');
            };
            
            img.src = URL.createObjectURL(file);
        } catch (error) {
            console.error('Image compression error:', error);
            this.showImageError('画像の圧縮中にエラーが発生しました。');
        }
    }

    calculateOptimalDimensions(originalWidth, originalHeight) {
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let width = originalWidth;
        let height = originalHeight;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        return { width, height };
    }

    processImageFile(file, imageNumber, inputElement) {
        if (file.size > 5 * 1024 * 1024) {
            this.showImageError('圧縮後もファイルサイズが5MBを超えています。別の画像を選択してください。');
            if (inputElement) {
                inputElement.value = '';
            }
            return;
        }

        const preview = document.getElementById(`preview-${imageNumber}`);
        const label = inputElement ? inputElement.nextElementSibling : null;

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'プレビュー ' + imageNumber;
            
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'remove-image';
            button.onclick = () => this.removeImage(imageNumber);
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-times';
            button.appendChild(icon);
            
            preview.appendChild(img);
            preview.appendChild(button);
            preview.classList.add('active');
            if (label) {
                label.style.display = 'none';
            }

            this.uploadedImages[imageNumber - 1] = {
                file: file,
                dataUrl: e.target.result,
                name: file.name
            };
        };
        reader.readAsDataURL(file);
    }

    removeImage(imageNumber) {
        const preview = document.getElementById(`preview-${imageNumber}`);
        const input = document.getElementById(`image-${imageNumber}`);
        const label = input.nextElementSibling;

        preview.innerHTML = '';
        preview.classList.remove('active');
        label.style.display = 'flex';
        input.value = '';

        this.uploadedImages[imageNumber - 1] = null;
    }

    async handleFormSubmit(event) {
        console.log('handleFormSubmit called!', event);
        event.preventDefault();
        
        if (!this.validateForm()) {
            console.log('Form validation failed');
            return;
        }

        console.log('Form validation passed, collecting data...');
        this.collectFormData();
        console.log('Form data collected:', this.formData);
        this.showLoadingModal();
        
        try {
            const generatedContent = await this.generateContent();
            this.generatedContent = generatedContent;
            
            this.showPreviewSection();
            
        } catch (error) {
            console.error('コンテンツ生成エラー:', error);
            this.hideLoadingModal();
            alert('記事の生成中にエラーが発生しました。もう一度お試しください。');
        }
    }

    validateForm() {
        const mainKeyword = document.getElementById('main-keyword').value.trim();
        
        if (!mainKeyword) {
            alert('メインキーワードは必須項目です。');
            document.getElementById('main-keyword').focus();
            return false;
        }

        return true;
    }

    collectFormData() {
        this.formData = {
            referenceUrl: document.getElementById('reference-url').value.trim(),
            targetAudience: document.getElementById('target-audience').value.trim(),
            mainKeyword: document.getElementById('main-keyword').value.trim(),
            totalLength: document.getElementById('word-count').value,
            images: this.uploadedImages.filter(img => img !== null)
        };
    }

    showImageError(message) {
        let modal = document.getElementById('image-error-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'image-error-modal';
            modal.className = 'modal';
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            const headerTitle = document.createElement('h3');
            const headerIcon = document.createElement('i');
            headerIcon.className = 'fas fa-exclamation-triangle';
            headerTitle.appendChild(headerIcon);
            headerTitle.appendChild(document.createTextNode(' 画像アップロードエラー'));
            modalHeader.appendChild(headerTitle);
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            const errorMessage = document.createElement('p');
            errorMessage.id = 'image-error-message';
            modalBody.appendChild(errorMessage);
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            const okButton = document.createElement('button');
            okButton.type = 'button';
            okButton.className = 'btn btn-primary';
            okButton.textContent = 'OK';
            okButton.onclick = () => modal.classList.remove('active');
            modalFooter.appendChild(okButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
        
        document.getElementById('image-error-message').textContent = message;
        modal.classList.add('active');
    }

    showImageProcessing(imageNumber, message) {
        const preview = document.getElementById(`preview-${imageNumber}`);
        preview.innerHTML = '';
        
        const processingDiv = document.createElement('div');
        processingDiv.className = 'processing-indicator';
        
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        
        const messageP = document.createElement('p');
        messageP.textContent = message;
        
        processingDiv.appendChild(spinner);
        processingDiv.appendChild(messageP);
        preview.appendChild(processingDiv);
        preview.classList.add('active');
    }

    showCompressionSuccess(imageNumber, originalSize, compressedSize, compressionRatio) {
        const originalMB = (originalSize / (1024 * 1024)).toFixed(1);
        const compressedMB = (compressedSize / (1024 * 1024)).toFixed(1);
        
        const preview = document.getElementById(`preview-${imageNumber}`);
        const successMessage = document.createElement('div');
        successMessage.className = 'compression-success';
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check-circle';
        
        const messageP = document.createElement('p');
        messageP.textContent = `圧縮完了: ${originalMB}MB → ${compressedMB}MB (${compressionRatio}%削減)`;
        
        successMessage.appendChild(checkIcon);
        successMessage.appendChild(messageP);
        
        preview.appendChild(successMessage);
        
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.remove();
            }
        }, 3000);
    }

    async generateContent() {
        this.updateProgress(20, 'OpenAI APIに接続中...');
        
        const keyword = this.formData.mainKeyword || this.formData.targetAudience;
        const options = {
            category: '技術情報',
            author: 'スタジオQ',
            targetAudience: this.formData.targetAudience,
            referenceUrl: this.formData.referenceUrl,
            wordCount: parseInt(this.formData.totalLength)
        };

        this.updateProgress(50, 'コンテンツを生成中...');

        let optimizedContent;
        
        try {
            const openaiApiKey = window.OPENAI_API_KEY || '';
            
            if (openaiApiKey && window.location.hostname === 'localhost') {
                this.updateProgress(60, 'OpenAI APIに直接接続中...');
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}`
                    },
                    body: JSON.stringify({
                        model: window.OPENAI_MODEL || 'gpt-4',
                        messages: [
                            {
                                role: "system",
                                content: "あなたは専門的なブログライターです。高品質で読みやすく、SEOに最適化された記事を作成します。"
                            },
                            {
                                role: "user",
                                content: this.buildPrompt(keyword, options)
                            }
                        ]
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status}`);
                }
                
                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse response as JSON:', responseText);
                    throw new Error('Invalid JSON response from API');
                }
                
                this.updateProgress(80, '記事を最適化中...');
                optimizedContent = this.optimizeContent(result.content);
            } else {
                this.updateProgress(60, 'モックコンテンツを生成中...');
                const mockContent = await this.generateMockContent(keyword, options);
                this.updateProgress(80, '記事を最適化中...');
                optimizedContent = this.optimizeContent(mockContent);
            }
        } catch (error) {
            console.error('OpenAI API error:', error);
            this.updateProgress(60, 'APIエラー - モックコンテンツを生成中...');
            
            const mockContent = await this.generateMockContent(keyword, options);
            
            this.updateProgress(80, '記事を最適化中...');
            optimizedContent = this.optimizeContent(mockContent);
        }
        
        this.updateProgress(100, '生成完了！');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return optimizedContent;
    }

    async generateMockContent(keyword, options) {
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    title: `${keyword}の完全ガイド - プロが教える実践的テクニック`,
                    excerpt: `${keyword}について、${options.targetAudience}向けに詳しく解説します。実践的なアドバイスと具体例を交えて、わかりやすくお伝えします。`,
                    content: this.buildMockContentHtml(keyword, options),
                    meta_description: `${keyword}について${options.targetAudience}向けに詳しく解説。実践的なテクニックと具体例を交えてわかりやすくお伝えします。`,
                    keywords: [keyword, '映像制作', '技術情報', 'スタジオQ'],
                    seo_score: 85,
                    category: options.category,
                    author: options.author,
                    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                    image: 'slide1.jpg'
                });
            }, 2000);
        });
    }

    buildMockContentHtml(keyword, options) {
        const h2_1 = String.fromCharCode(60) + 'h2' + String.fromCharCode(62) + 'はじめに' + String.fromCharCode(60) + '/h2' + String.fromCharCode(62);
        const p1 = String.fromCharCode(60) + 'p' + String.fromCharCode(62) + keyword + 'は現代の映像制作において重要な技術です。この記事では、' + (options.targetAudience || 'クリエイター') + 'の皆様に向けて、実践的な内容をお届けします。' + String.fromCharCode(60) + '/p' + String.fromCharCode(62);
        
        const h2_2 = String.fromCharCode(60) + 'h2' + String.fromCharCode(62) + '基本的な概念' + String.fromCharCode(60) + '/h2' + String.fromCharCode(62);
        const p2 = String.fromCharCode(60) + 'p' + String.fromCharCode(62) + keyword + 'の基本的な概念について説明します。まず理解しておくべき重要なポイントを整理しましょう。' + String.fromCharCode(60) + '/p' + String.fromCharCode(62);
        
        const h2_3 = String.fromCharCode(60) + 'h2' + String.fromCharCode(62) + '実践的なテクニック' + String.fromCharCode(60) + '/h2' + String.fromCharCode(62);
        const p3 = String.fromCharCode(60) + 'p' + String.fromCharCode(62) + '実際の制作現場で使える具体的なテクニックをご紹介します。これらの方法を活用することで、より効率的な作業が可能になります。' + String.fromCharCode(60) + '/p' + String.fromCharCode(62);
        
        const h2_4 = String.fromCharCode(60) + 'h2' + String.fromCharCode(62) + 'まとめ' + String.fromCharCode(60) + '/h2' + String.fromCharCode(62);
        const p4 = String.fromCharCode(60) + 'p' + String.fromCharCode(62) + keyword + 'について解説してきました。今回ご紹介した内容を参考に、ぜひ実際の制作に活用してください。' + String.fromCharCode(60) + '/p' + String.fromCharCode(62);
        
        return h2_1 + p1 + h2_2 + p2 + h2_3 + p3 + h2_4 + p4;
    }

    buildPrompt(keyword, options = {}) {
        const category = options.category || '技術情報';
        const siteName = 'スタジオQ';
        
        return `あなたは${siteName}の専門的なブログライターです。以下の要件に従って、高品質なブログ記事を作成してください。

【記事要件】
- キーワード: ${keyword}
- カテゴリー: ${category}
- 対象読者: 映像制作・音響技術に興味のあるクリエイター
- 文字数: 1500-2000文字
- 文体: 専門的だが親しみやすい

【記事構成】
1. 導入部分（問題提起・興味を引く内容）
2. 主要コンテンツ（3-4つのセクション）
3. 実践的なアドバイス・具体例
4. まとめ（行動を促す内容）

【SEO要件】
- キーワードを自然に含める（密度2-3%）
- 見出しにキーワードを含める
- 読みやすい段落構成
- 専門用語の適切な説明

【出力形式】
以下のJSON形式で出力してください：

{
  "title": "魅力的なタイトル（キーワードを含む）",
  "excerpt": "記事の概要（150文字以内）",
  "content": "HTML形式の記事本文（h2, h3, p, ul, li, strongタグを使用）",
  "meta_description": "SEO用メタディスクリプション（160文字以内）",
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "seo_score": 85
}

記事を作成してください。`;
    }

    optimizeContent(content) {
        const baseUrl = 'https://studioq.jp';
        
        content.slug = this.generateSlug(content.title);
        content.structured_data = this.generateStructuredData(content, baseUrl);
        
        return content;
    }

    generateSlug(title) {
        const date = new Date().toISOString().split('T')[0];
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `${date}-${randomStr}`;
    }

    generateStructuredData(content, baseUrl) {
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": content.title,
            "description": content.meta_description,
            "author": {
                "@type": "Organization",
                "name": content.author
            },
            "publisher": {
                "@type": "Organization",
                "name": "スタジオQ",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${baseUrl}/images/studioq_logo-1.png`
                }
            },
            "datePublished": content.date.replace(/\./g, '-'),
            "dateModified": content.date.replace(/\./g, '-'),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${baseUrl}/blog/${content.slug}.html`
            },
            "image": `${baseUrl}/images/${content.image}`,
            "keywords": Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords
        };
    }

    showLoadingModal() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.classList.add('active');
            this.updateProgress(0, 'OpenAI APIに接続中...');
        }
    }

    hideLoadingModal() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.classList.remove('active');
            console.log('Modal hidden'); // Debug log
        }
    }

    updateProgress(percentage, message) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    showPreviewSection() {
        this.hideLoadingModal();
        
        const waitForElements = () => {
            return new Promise((resolve) => {
                const checkElements = () => {
                    const formContainer = document.getElementById('generator-form-container');
                    const previewContainer = document.getElementById('preview-container');
                    
                    console.log('Checking DOM elements:', {
                        formContainer: !!formContainer,
                        previewContainer: !!previewContainer,
                        documentReady: document.readyState
                    });
                    
                    if (formContainer && previewContainer) {
                        resolve({ formContainer, previewContainer });
                    } else {
                        setTimeout(checkElements, 100);
                    }
                };
                checkElements();
            });
        };
        
        waitForElements().then(({ formContainer, previewContainer }) => {
            console.log('DOM elements found, transitioning to preview section');
            
            formContainer.style.display = 'none';
            previewContainer.style.display = 'block';
            
            const pageTitle = document.querySelector('.page-title');
            const pageSubtitle = document.querySelector('.page-subtitle');
            
            if (pageTitle) {
                pageTitle.textContent = '記事プレビュー・編集';
            }
            if (pageSubtitle) {
                pageSubtitle.textContent = '生成された記事を確認し、必要に応じて編集してください';
            }
            
            this.populatePreviewForm();
            this.initializeQuillEditors();
            this.displayUploadedImages();
            
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        }).catch((error) => {
            console.error('Failed to find DOM elements for preview section:', error);
            alert('プレビューセクションの表示に問題が発生しました。ページを再読み込みしてください。');
        });
    }

    initializeCharacterCounters() {
        const titleInput = document.getElementById('preview-title');
        const descInput = document.getElementById('preview-meta-description');
        
        if (titleInput) {
            this.updateCharCounter('title-counter', titleInput.value.length);
        }
        
        if (descInput) {
            this.updateCharCounter('description-counter', descInput.value.length);
        }
    }

    populatePreviewForm() {
        if (!this.generatedContent) {
            console.warn('No generated content available for preview');
            return;
        }

        const titleElement = document.getElementById('preview-title');
        const metaElement = document.getElementById('preview-meta-description');
        const jsonElement = document.getElementById('preview-json-ld');

        if (titleElement) {
            titleElement.value = this.generatedContent.title || '';
            this.updateCharCounter('title-counter', this.generatedContent.title?.length || 0);
        }
        
        if (metaElement) {
            metaElement.value = this.generatedContent.meta_description || '';
            this.updateCharCounter('description-counter', this.generatedContent.meta_description?.length || 0);
        }
        
        if (jsonElement) {
            jsonElement.value = JSON.stringify(this.generatedContent.structured_data || {}, null, 2);
        }
    }

    initializeQuillEditors() {
        if (!window.quillManager) {
            console.warn('QuillManager not available');
            return;
        }
        
        if (!this.generatedContent) {
            console.warn('No generated content for Quill editors');
            return;
        }

        const sections = window.quillManager.parseContentToSections(this.generatedContent.content || '');

        for (let i = 1; i <= 4; i++) {
            const section = sections[i - 1] || { heading: `セクション ${i}`, content: '' };
            
            const headingElement = document.getElementById(`heading-${i}`);
            if (headingElement) {
                headingElement.textContent = section.heading;
            }
            
            const editorContainer = document.getElementById(`editor-${i}`);
            if (editorContainer) {
                window.quillManager.initializeEditor(`editor-${i}`, section.content);
            } else {
                console.warn(`Editor container editor-${i} not found`);
            }
        }
    }

    displayUploadedImages() {
        const imagesContainer = document.getElementById('uploaded-images');
        const imagesSection = document.getElementById('images-section');
        
        if (!imagesContainer || !this.uploadedImages.length) {
            if (imagesSection) {
                imagesSection.style.display = 'none';
            }
            return;
        }

        imagesContainer.innerHTML = '';
        
        this.uploadedImages.forEach((image, index) => {
            if (image) {
                const imageItem = document.createElement('div');
                imageItem.className = 'uploaded-image-item';
                const img = document.createElement('img');
                img.src = image.dataUrl;
                img.alt = image.name;
                
                const imageInfo = document.createElement('div');
                imageInfo.className = 'image-info';
                
                const imageName = document.createElement('div');
                imageName.className = 'image-name';
                imageName.textContent = image.name;
                
                const imageActions = document.createElement('div');
                imageActions.className = 'image-actions';
                
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn btn-secondary';
                deleteButton.onclick = () => this.removeUploadedImage(index);
                
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fas fa-trash';
                
                deleteButton.appendChild(deleteIcon);
                deleteButton.appendChild(document.createTextNode(' 削除'));
                
                imageActions.appendChild(deleteButton);
                imageInfo.appendChild(imageName);
                imageInfo.appendChild(imageActions);
                
                imageItem.appendChild(img);
                imageItem.appendChild(imageInfo);
                imagesContainer.appendChild(imageItem);
            }
        });
    }

    removeUploadedImage(index) {
        this.uploadedImages[index] = null;
        this.displayUploadedImages();
    }

    validateJson() {
        const jsonTextarea = document.getElementById('preview-json-ld');
        try {
            JSON.parse(jsonTextarea.value);
            alert('JSON形式は正しいです。');
        } catch (error) {
            alert('JSON形式にエラーがあります: ' + error.message);
        }
    }

    formatJson() {
        const jsonTextarea = document.getElementById('preview-json-ld');
        try {
            const parsed = JSON.parse(jsonTextarea.value);
            jsonTextarea.value = JSON.stringify(parsed, null, 2);
        } catch (error) {
            alert('JSON形式にエラーがあります: ' + error.message);
        }
    }

    handlePreviewSubmit(event) {
        event.preventDefault();
        this.showPublishModal();
    }

    bindPublishEvents() {
        const publishModal = document.getElementById('publish-modal');
        const successModal = document.getElementById('success-modal');
        const cancelPublish = document.getElementById('cancel-publish');
        const confirmPublish = document.getElementById('confirm-publish');
        const closeSuccess = document.getElementById('close-success');
        const copyUrl = document.getElementById('copy-url');

        if (cancelPublish) {
            cancelPublish.addEventListener('click', () => {
                publishModal.classList.remove('active');
            });
        }

        if (confirmPublish) {
            confirmPublish.addEventListener('click', () => this.publishArticle());
        }

        if (closeSuccess) {
            closeSuccess.addEventListener('click', () => {
                successModal.classList.remove('active');
                window.location.href = '../../blog/';
            });
        }

        if (copyUrl) {
            copyUrl.addEventListener('click', () => this.copyPublishedUrl());
        }

        const shareTwitter = document.getElementById('share-twitter');
        const shareFacebook = document.getElementById('share-facebook');
        const shareLinkedin = document.getElementById('share-linkedin');

        if (shareTwitter) {
            shareTwitter.addEventListener('click', () => this.shareOnTwitter());
        }

        if (shareFacebook) {
            shareFacebook.addEventListener('click', () => this.shareOnFacebook());
        }

        if (shareLinkedin) {
            shareLinkedin.addEventListener('click', () => this.shareOnLinkedin());
        }
    }

    showPublishModal() {
        const modal = document.getElementById('publish-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    async publishArticle() {
        const publishModal = document.getElementById('publish-modal');
        publishModal.classList.remove('active');

        try {
            const finalData = this.collectFinalData();
            
            const publishedUrl = await this.saveArticle(finalData);
            
            this.showSuccessModal(publishedUrl);
            
        } catch (error) {
            console.error('公開エラー:', error);
            alert('記事の公開中にエラーが発生しました。もう一度お試しください。');
        }
    }

    collectFinalData() {
        const title = document.getElementById('preview-title').value;
        const metaDescription = document.getElementById('preview-meta-description').value;
        const jsonLd = document.getElementById('preview-json-ld').value;

        const content = window.quillManager ? window.quillManager.generateContentFromSections() : this.generatedContent.content;

        return {
            ...this.generatedContent,
            title: title,
            meta_description: metaDescription,
            content: content,
            structured_data: JSON.parse(jsonLd),
            images: this.uploadedImages.filter(img => img !== null)
        };
    }

    async saveArticle(articleData) {
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const baseUrl = 'https://studioq.jp';
                const publishedUrl = `${baseUrl}/blog/${articleData.slug}.html`;
                resolve(publishedUrl);
            }, 1000);
        });
    }

    showSuccessModal(publishedUrl) {
        const modal = document.getElementById('success-modal');
        const urlInput = document.getElementById('published-url');
        
        if (modal && urlInput) {
            urlInput.value = publishedUrl;
            this.publishedUrl = publishedUrl;
            modal.classList.add('active');
        }
    }

    copyPublishedUrl() {
        const urlInput = document.getElementById('published-url');
        if (urlInput) {
            urlInput.select();
            document.execCommand('copy');
            alert('URLをコピーしました！');
        }
    }

    shareOnTwitter() {
        if (this.publishedUrl) {
            const text = encodeURIComponent(`新しいブログ記事を公開しました: ${this.generatedContent.title}`);
            const url = encodeURIComponent(this.publishedUrl);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        }
    }

    shareOnFacebook() {
        if (this.publishedUrl) {
            const url = encodeURIComponent(this.publishedUrl);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        }
    }

    shareOnLinkedin() {
        if (this.publishedUrl) {
            const url = encodeURIComponent(this.publishedUrl);
            const title = encodeURIComponent(this.generatedContent.title);
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
        }
    }

    goBack() {
        const formContainer = document.getElementById('generator-form-container');
        const previewContainer = document.getElementById('preview-container');
        
        if (formContainer && previewContainer) {
            formContainer.style.display = 'block';
            previewContainer.style.display = 'none';
            
            const pageTitle = document.querySelector('.page-title');
            const pageSubtitle = document.querySelector('.page-subtitle');
            
            if (pageTitle) {
                pageTitle.textContent = 'AI ブログ記事生成';
            }
            if (pageSubtitle) {
                pageSubtitle.textContent = 'OpenAI APIを使用して高品質なブログ記事を自動生成・編集します';
            }
            
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showImageError(message) {
        let modal = document.getElementById('image-error-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'image-error-modal';
            modal.className = 'modal';
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            const headerTitle = document.createElement('h3');
            const headerIcon = document.createElement('i');
            headerIcon.className = 'fas fa-exclamation-triangle';
            headerTitle.appendChild(headerIcon);
            headerTitle.appendChild(document.createTextNode(' 画像アップロードエラー'));
            modalHeader.appendChild(headerTitle);
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            const errorMessage = document.createElement('p');
            errorMessage.id = 'image-error-message';
            modalBody.appendChild(errorMessage);
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            const okButton = document.createElement('button');
            okButton.type = 'button';
            okButton.className = 'btn btn-primary';
            okButton.textContent = 'OK';
            okButton.onclick = () => modal.classList.remove('active');
            modalFooter.appendChild(okButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
        
        document.getElementById('image-error-message').textContent = message;
        modal.classList.add('active');
    }

    showImageProcessing(imageNumber, message) {
        const preview = document.getElementById(`preview-${imageNumber}`);
        preview.innerHTML = '';
        
        const processingDiv = document.createElement('div');
        processingDiv.className = 'processing-indicator';
        
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        
        const messageP = document.createElement('p');
        messageP.textContent = message;
        
        processingDiv.appendChild(spinner);
        processingDiv.appendChild(messageP);
        preview.appendChild(processingDiv);
        preview.classList.add('active');
    }

    showCompressionSuccess(imageNumber, originalSize, compressedSize, compressionRatio) {
        const originalMB = (originalSize / (1024 * 1024)).toFixed(1);
        const compressedMB = (compressedSize / (1024 * 1024)).toFixed(1);
        
        const preview = document.getElementById(`preview-${imageNumber}`);
        const successMessage = document.createElement('div');
        successMessage.className = 'compression-success';
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check-circle';
        
        const messageP = document.createElement('p');
        messageP.textContent = `圧縮完了: ${originalMB}MB → ${compressedMB}MB (${compressionRatio}%削減)`;
        
        successMessage.appendChild(checkIcon);
        successMessage.appendChild(messageP);
        
        preview.appendChild(successMessage);
        
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.remove();
            }
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Blog Generator UI initialized');
    const blogGenerator = new BlogGeneratorUI();
    blogGenerator.init();
});
