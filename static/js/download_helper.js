var DownloadHelper = (function($) {
    var wechatMask = '<div id="weixin-mask" class="weixin-mask {$phoneType}" style="display: block">' +
        '    <div class="weixin-mask-content">' +
        '        <div class="browser-icon">' +
        '            <img src="{$browserIcon}">' +
        '        </div>' +
        '        <div class="app-icon">' +
        '            <img src="{$icon}" />' +
        '            <div class="appName">{$gameName}</div>' +
        '        </div>' +
        '    </div>' +
        '</div>';
    var iosHelperTip = '<div class="tip-wrap" id="tip-wrap">'+
        '  <div class="mask" id="tip-mask"></div>' +
        '  <div class="tip-content" id="tip-content">' +
        '    <div class="tip-title">温馨提示</div>' +
        '    <div class="tip-detail">点击“<strong>安装</strong>”后游戏会直接添加到<strong>桌面</strong>安装，请记得到桌面查找哦。</div>' +
        '    <div><img class="tip-img" src="{$helperTip}" alt=""></div>' +
        '    <div class="controls">' +
        '      <button type="button" class="tip-btn js-close">我知道了</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    var ios9PlusHelperTip = '<div class="tip-wrap  tip-wrap-ios9" id="tip-wrap">'+
        '  <div class="mask" id="tip-mask"></div>' +
        '  <div class="tip-content" id="tip-content">' +
        '    <div class="tip-title">温馨提示</div>' +
        '    <div class="tip-detail">一、点击“<strong>安装</strong>”后游戏会直接添加到<strong>桌面</strong>安装，请记得到桌面查找哦。</div>' +
        '    <div><img class="tip-img" src="{$helperTip}" alt=""></div>' +
        '    <div class="tip-detail">二、<span class="red">安装成功后，信任证书</span>即可使用。</div>' +
        '    <div><img class="tip-img" src="{$trustTip}" alt=""></div>' +
        '    <div class="controls">' +
        '      <button type="button" class="tip-btn js-close">我知道了</button>' +
        '      <a href="{$trustHelperUrl}" class="tip-btn">立即信任</a>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    var dialogTemplate = '<div class="dialog">'+
        '    <div class="mask"></div>'+
        '    <div class="dialog-container">'+
        '        <div class="dialog-header"><div class="dialog-close js-close">&times;</div></div>'+
        '        <div class="dialog-content">'+
        '        </div>'+
        '    </div>'+
        '</div>';
    var iosDefaultConfig = {
        enabled: false,
        // IOS下载地址: appstore地址或者plist文件地址
        url: '',
        // 浏览器图标
        trustMode: 'none', // 支持 popup、link 和 none
        browserIcon: 'static/picture/browser-ios.png',
        // 信任教程地址
        trustHelperUrl: 'trust.html',
        helperTip: 'static/picture/tip.jpg',
        trustTip: 'static/picture/xinren.png',
        iosHelperTipTemplate: iosHelperTip,
        ios9PlusHelperTipTemplate: ios9PlusHelperTip,
        onDownload: null,
    }
    var androidDefaultConfig = {
        enabled: false,
        // Android包地址
        url: '',
        // 浏览器图标
        browserIcon: 'static/picture/browser-android.png',
        onDownload: null,
    }

    var pcDefaultConfig = {
        enabled: false,
        url: '',
        onDownload: null,
    }
    var defaultConfig = {
        // 按钮节点
        el: '#download-helper',
        // APP图标
        icon: 'images/game-icon.png',
        gameName: '',
        wechatMaskTemplate: wechatMask,
        dialogTemplate: dialogTemplate,
        ios: iosDefaultConfig,
        android: androidDefaultConfig,
        pc: pcDefaultConfig
    }

    var ua = window.navigator.userAgent;

    var isIos = !!ua.match(/iPhone OS|iPad; CPU OS/);

    var isAndroid = !!ua.match(/Android/);

    var isWechat = !!ua.match(/MicroMessenger/);

    function getIosVersion() {
        var regExp = /(iPhone OS|iPad; CPU OS)[\s\/]*([\d\_\.]*)/
        var matchResult = ua.match(regExp);
        if (matchResult && matchResult[2]) {
            version = matchResult[2].split(/[_\.]/)
            return parseInt(version[0]);
        }
        return -1;
    }

    var ios9Plus = getIosVersion() >= 9;

    var DownloadHelper = function(params) {
        // 合并配置
        var config = this.config = $.extend(true, {}, defaultConfig, params);
        // 默认不可点击
        var downloadUrl = 'javascript: void(0);';

        if (config.pc.enabled) {
            downloadUrl = config.pc.url;
        }

        // IOS链接
        if (isIos && config.ios.enabled) {
            downloadUrl = config.ios.url;
        }
        // Android包链接
        if (isAndroid && config.android.enabled) {
            downloadUrl = config.android.url;
        }
        
        $(config.el)
            // 初始化链接
        .data('href', downloadUrl)
            // 绑定点击事件
        .on('click', this.btnDownloadClickHandler.bind(this))
    }

    DownloadHelper.os = {
        ios: isIos,
        android: isAndroid,
        wechat: isWechat,
    }

    DownloadHelper.prototype.btnDownloadClickHandler = function(event) {
        var config = this.config,
            url = $(event.currentTarget).data('href');

        event.preventDefault();

        if (isWechat) {
            this.showWechatMask();
            return false;
        }

        if (this.checkInterval(event.currentTarget)) return;

        if (isIos) {
            if (config.ios.enabled) {
                if (this.checkIosInterval(event.currentTarget)) return;
                typeof config.ios.onDownload === 'function' && config.ios.onDownload()
                if (config.ios.trustMode == 'popup') {
                    this.showIosHelper();
                } else if (config.ios.trustMode == 'link') {
                    this.redirect(this.config.ios.trustHelperUrl, true);
                }
                window.setTimeout(function() {
                    this.redirect(url);
                }.bind(this), 0)
                return;
            } else {
                return this.showEmptyIos();
            }
        }

        if (isAndroid) {
            if (!config.android.enabled) {
                $this.showEmptyAndroid();
                return;
            }
            if (this.checkAndroidInterval(event.currentTarget)) return;
            typeof config.android.onDownload === 'function' && config.android.onDownload()
            window.setTimeout(function() {
                this.redirect(url);
            }.bind(this), 0)
            return;
        }

        if (config.pc.enabled) {
            typeof config.pc.onDownload === 'function' && config.pc.onDownload()
            window.setTimeout(function() {
                this.redirect(url);
            }.bind(this), 0)
            return;
        }

        this.showQRCode();
    }

    DownloadHelper.prototype.checkIosInterval = function(el) {
        var config = this.config.ios
        return DownloadHelper.checkInterval(el, config)
    }

    DownloadHelper.prototype.checkAndroidInterval = function(el) {
        var config = this.config.android
        return DownloadHelper.checkInterval(el, config)
    }

    DownloadHelper.prototype.checkInterval = function(el) {
        var config = this.config
        return DownloadHelper.checkInterval(el, config)
    }

    var startTime = null;
    DownloadHelper.checkInterval = function(el, config) {
        if (!config.interval) return false;

        var now = +new Date()

        if (!startTime) {
            startTime = now
            return false
        }

        
        if (now - startTime > config.interval * 1000) {
            startTime = now
            return false
        }

        DownloadHelper.tip('您操作太频繁啦，请稍候', 2, el)

        return true
    }

    DownloadHelper.prototype.showWechatMask = function() {
        var mask = getMask(this.config);
        $(mask).appendTo(document.body)
            .show();
    }

    DownloadHelper.prototype.showIosHelper = function() {
        var that = this;
        if (!this.IosHelperTip) {
            this.IosHelperTip = $(getHelperTip(this.config));
            this.IosHelperTip.appendTo(document.body)
                .on('click', '.js-close', function() {
                    that.IosHelperTip.hide();
                })
        }
        this.IosHelperTip.show()
    }

    DownloadHelper.prototype.redirect = function(url, newWin) {
        var that = this;
        newWin = newWin ? "_blank" : ""
        if (!this.hideClickTarget) {
            this.hideClickTarget = $('<a>&nbsp;</a>');
            this.hideClickTarget
                .css({
                    'line-height': '0',
                    'font-size': '0',
                    'width': '1px',
                    'height': '1px',
                    'opacity': '0'
                })
                
                // .prop('target', '_blank');
        }
        this.hideClickTarget
            .prop('target', newWin)
            .prop('href', url)
        this.hideClickTarget[0].click();

    }

    DownloadHelper.prototype.showQRCode = function() {
        if (!this.QRCodeTip) {
            var QRcontent = $('<div><h3>扫描二维码下载游戏</h3></div>')
            $('<div id="qrcode"></div>').qrcode({
                text: location.href
            }).appendTo(QRcontent);
            this.QRCodeTip = getDialog(this.config, QRcontent);
            this.QRCodeTip.appendTo(document.body)
        }
        this.QRCodeTip.show();
    }

    DownloadHelper.prototype.showEmptyIos = function() {
        if (!this.emptyTip) {
            this.emptyTip = getDialog(this.config, '<p class="red">暂不支持IOS系统</p>');
            this.emptyTip.appendTo(document.body)
        }

        this.emptyTip.show();
    }

    DownloadHelper.prototype.showEmptyAndroid = function() {
        if (!this.emptyTip) {
            this.emptyTip = getDialog(this.config, '<p class="red">暂不支持Android系统</p>');
            this.emptyTip.appendTo(document.body)
        }

        this.emptyTip.show();
    }
    var dialogNode;
    DownloadHelper.prototype.dialog = function(message) {
        if (!dialogNode) {
            dialogNode = getDialog(this.config, '<p class="__dialog_message__"></p>');
            dialogNode.appendTo(document.body)
        }
        dialogNode.find('.__dialog_message__').html(message)
        dialogNode.show()
    }

    var tipNode, tipTimer;
    DownloadHelper.tip = function(message, delay, el) {
        delay = delay || 2
        if (!tipNode) {
            tipNode = $('<div class="tip"/>')
            tipNode.appendTo(el || document.body)
        }
        if (tipTimer) window.clearTimeout(tipTimer)
        tipTimer = window.setTimeout(function() { tipNode.hide() }, delay * 1000)
        tipNode.html(message)
        tipNode.show()
    }

    function getDialog(config, content) {
        var dialog = $(config.dialogTemplate);
        dialog.on('click', '.js-close', function() {
                    dialog.hide();
            })
            .find('.dialog-content').append(content);
        return dialog;
    }

    function getHelperTip(config) {
        var tipHelperTemplate = config.ios.iosHelperTipTemplate;
        if (ios9Plus && config.ios.url.match(/^itms-services:\/\//)) {
            tipHelperTemplate = config.ios.ios9PlusHelperTipTemplate;
        }
        return tipHelperTemplate.replace('{$helperTip}', config.ios.helperTip)
            .replace('{$trustTip}', config.ios.trustTip)
            .replace('{$trustHelperUrl}', config.ios.trustHelperUrl);
    }

    function getMask(config) {
        var phoneType = 'android';
            browserIcon = config.android.browserIcon;
            icon = config.icon,
            gameName = config.gameName;
        if (isIos) {
            phoneType = 'ios';
            browserIcon = config.ios.browserIcon;
        }
        var wechatMask = config.wechatMaskTemplate;
        return wechatMask.replace('{$phoneType}', phoneType)
                    .replace('{$browserIcon}', browserIcon)
                    .replace('{$icon}', icon)
                    .replace('{$gameName}', gameName)
    }

    return DownloadHelper;
}(jQuery))