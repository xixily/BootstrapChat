/**
 * Created by dengxf on 2017/3/27.
 */
(function($){

    var websocket = undefined;
    var times = 0;
    var MAXTIMES = 10;
    /**
     * 日期格式化
     * @param fmt "yyyy-MM-dd HH:mm:ss"
     * @returns string
     * @private
     */
    Date.prototype.format__=function(fmt) {
        var o = {
            "M+" : this.getMonth()+1, //月份
            "d+" : this.getDate(), //日
            "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时
            "H+" : this.getHours(), //小时
            "m+" : this.getMinutes(), //分
            "s+" : this.getSeconds(), //秒
            "q+" : Math.floor((this.getMonth()+3)/3), //季度
            "S" : this.getMilliseconds() //毫秒
        };
        var week = {
            "0" : "/u65e5",
            "1" : "/u4e00",
            "2" : "/u4e8c",
            "3" : "/u4e09",
            "4" : "/u56db",
            "5" : "/u4e94",
            "6" : "/u516d"
        };
        if(/(y+)/.test(fmt)){
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        }
        if(/(E+)/.test(fmt)){
            fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);
        }
        for(var k in o){
            if(new RegExp("("+ k +")").test(fmt)){
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
            }
        }
        return fmt;
    }

    /**
     * 定义BootstrapChat
     * @param dom
     * @param options
     * @constructor
     */
    var BootstrapChat = function(dom, options){
        options = options || {};
        this.$jq = $(dom);
        this.$jq_ = this.$jq.clone();
        this.$jq.after(this.$jq_);
        this.$jq.css("display","none");
        this.dateValue = new Date().valueOf();
        this.datePattern = "yyyy-MM-dd HH:mm:ss";
        this.language = options.language ||  'cn';
        this.url = options.url || '';
        this.socketJs_url = options.socketJs_url || "";
        this.websocket = websocket;
        this.onClickSend_ = options.onClickSend;
        this.onClickRefresh_ = options.onClickRefresh;
        this.onClickOnline_ = options.onClickOnline;
        this.onClickBusy_ = options.onClickBusy;
        this.onClickLeave_ = options.onClickLeave;
        this.onClickLoginOut_ = options.onClickLoginOut;
        //websocket 方法
        this.onclose = options.onclose;
        this.onerror = options.onerror;
        this.onmessage = options.onmessage;
        this.onopen = options.onopen;
        this.regex = /^\s*$/g;
        // webMessgaes
        this.to = options.to;
        this.msg_type  = options.msg_type || '100';
        this.lis_id = options.lis_id;
        this.ownerId = options.ownerId;
    };

    /**
     * BootstrapChat 默认属性
     * @type {{}}
     */
    var DEFAULTS = {
        dom:{
            class:'chat-panel panel panel-default',
            head:{
                item:'<div>',
                class:'panel-heading',
                content:[{
                    item:'<i>',
                    class:'fa fa-comments fa-fw',
                },{
                    item:'<span>',
                    text:'聊天'
                },{
                    item:'<div>',
                    class:'btn-group pull-right',
                    content:[{
                        item:'<button>',
                        class:'btn btn-default btn-xs dropdown-toggle',
                        property:{
                            type:'button'
                        },
                        exProperty:{
                            data_toggle:'dropdown',
                            aria_expanded:'true'
                        },
                        content:[{
                            item:'<i>',
                            class:'fa fa-chevron-down'
                        }]
                    },{
                        item:'<ul>',
                        class:'dropdown-menu slidedown',
                        content:[{
                            item:'<li>',
                            content:[{
                                item:'<a>',
                                content:[{
                                    item:'<i>',
                                    class:'fa fa-refresh fa-fw'
                                },{
                                    item:'<span>',
                                    text:'刷新'
                                }]
                            }],
                            exProperty:{
                                chat_target:"refresh"
                            }
                        },{
                            item:'<li>',
                            content:[{
                                item:'<a>',
                                content:[{
                                    item:'<i>',
                                    class:'fa fa-check-circle fa-fw'
                                },{
                                    item:'<span>',
                                    text:'在线'
                                }]
                            }],
                            exProperty:{
                                chat_target:"online"
                            }
                        },{
                            item:'<li>',
                            content:[{
                                item:'<a>',
                                content:[{
                                    item:'<i>',
                                    class:'fa fa-times fa-fw'
                                },{
                                    item:'<span>',
                                    text:'繁忙'
                                }]
                            }],
                            exProperty:{
                                chat_target:"busy"
                            }
                        },{
                            item:'<li>',
                            content:[{
                                item:'<a>',
                                content:[{
                                    item:'<i>',
                                    class:'fa fa-clock-o fa-fw'
                                },{
                                    item:'<span>',
                                    text:'离开'
                                }]
                            }],
                            exProperty:{
                                chat_target:"leave"
                            }
                        },{
                            item:'<li>',
                            class:'divider'
                        },{
                            item:'<li>',
                            content:[{
                                item:'<a>',
                                content:[{
                                    item:'<i>',
                                    class:'fa fa-sign-out fa-fw'
                                },{
                                    item:'<span>',
                                    text:'退出'
                                }]
                            }],
                            exProperty:{
                                chat_target:"logout"
                            }
                        }]
                    }]
                }]
            },
            body:{
                item:'<div>',
                class:'panel-body',
                style:'height:150px;',
                content:[{
                    item:'<ul>',
                    class:'chat',
                    content:[{
                        item:'<li>',
                        class:'left clearfix',
                        content:[{
                            item:'<span>',
                            class:'chat-img pull-left',
//                            content:[{
//                                item:'<img>',
//                                class:'img-circle',
//                                property:{
////                                    src:"app/images/sys_60.png",
////                                    alt:'系统消息',
//                                },
//                                exProperty:{
//                                    app_data:"img"
//                                }
//                            }]
                        },{
                            item:'<div>',
                            class:'chat-body clearfix',
                            content:[{
                                item:'<div>',
                                class:'header',
                                content:[{
                                    item:'<strong>',
                                    class:'primary-font',
                                    content:[{
                                        item:'<span>',
                                        style:'color: #33a731;',
                                        exProperty:{
                                            app_data:'sender'
                                        },
                                        text:'[系统消息]'
                                    }]
                                },{
                                    item:'<small>',
                                    class:'pull-right text-muted',
                                    content:[{
                                        item:'<i>',
                                        class:'fa fa-clock-o fa-fw'
                                    },{
                                        item:'<span>',
                                        exProperty:{
                                            app_data:'time'
                                        },
                                        text: new Date().format__(this.date_pattern ? this.date_pattern : "yyyy-MM-dd HH:mm:ss")
                                    }]
                                }]
                            },{
                                item:'<p>',
                                style:"color:#66b665;",
                                exProperty:{
                                    app_data:'msg'
                                },
                                text:'欢迎使用 BootstrapChat！'
                            }]
                        }]
                    }]
                }]
            },
            footer:{
                item:'<div>',
                class:'panel-footer',
                content:[{
                    item:'<form>',
                    content:[{
                        item:'<div>',
                        class:'input-group',
                        content:[{
                            item:'<input>',
                            class:'form-control input-sm',
                            property:{
                                type:'text',
                                name:'msg',
                                placeholder:'输入回复内容...'
                            }
                        },{
                            item:'<span>',
                            class:'input-group-btn',
                            content:[{
                                item:'<button>',
//                                id:'chat_send_btn_' + this.dateValue,
                                class:'btn btn-warning btn-sm',
                                property:{
                                    role:'button'
                                },
                                exProperty:{
                                    app_action:'BootstrapChat.__sendMessages'
                                },
                                text: '发送'
                            }]
                        }]
                    }]
                }]
            },
        },
        language:{
            en:{
                head_title: 'Chat',
                sys_img_alt: 'System messages.',
                sys_Name: '[System messages]',
                welcome:'Welcome to BootstrapChat!',
                sender_placeholder: 'Enter the reply content ...',
                sender_text:'Send'
            },
            cn:{
                head_title: '聊天',
                sys_img_alt: '系统消息.',
                sys_Name: '[系统消息]',
                welcome:'欢迎使用 BootstrapChat！',
                sender_placeholder: '输入回复内容...',
                sender_text:'发送'
            }
        },
        handler:{
            onClickSend:function(data){

            },
            onClickEmoji:function(dom){

            },
            onSelectEmoji:function(dom){

            }
        },
        ids:{
            body: 'chat_body_',
            chat_ul: 'chat_ul_',
            footer:'chat_footer_',
            input:'chat_msg_input_',
            send:'chat_send_btn_',
            drop_btn:'drop_btn_',
            drop_ul:'drop_ul_'
        },
        datePattern: "yyyy-MM-dd HH:mm:ss",
        sender:{
            me: {
                src: 'images/blue_60.png',
                alt: '发信人',
                class: 'img-circle'
            },
            sender: {
                src: 'images/red_60.png',
                alt: '发信人',
                class: 'img-circle'
            },
            checker: {
                src: 'images/red_60.png',
                alt: '发信人',
                class: 'img-circle'
            },
            system: {
                src: 'images/sys_60.png',
                alt: '系统消息',
                class: 'img-circle'
            }
        }
    };

    /**
     * 合并用户optinos 并动态生成一些数据。
     * @param that
     * @param options
     * @param language
     */
    var getOptions = function(that, options, language){
        language = language || this.language;
        var defaults = $.extend(true, {}, DEFAULTS);
        /* head 动态id */
        defaults.dom.head.content[2].content[0].id = defaults.ids.drop_btn + that.dateValue ;
        defaults.dom.head.content[2].content[1].id = defaults.ids.drop_ul + that.dateValue ;
        /* body 动态id */
        defaults.dom.body.id = defaults.ids.body + that.dateValue;
        defaults.dom.body.content[0].id = defaults.ids.chat_ul + that.dateValue;
        defaults.dom.body.content[0].content[0].content[1].content[0].content[1].content[1].text = new Date().format__(defaults.datePattern ? defaults.datePattern : "yyyy-MM-dd HH:mm:ss");
        /* footer 动态id */
        defaults.dom.footer.id = defaults.ids.footer + that.dateValue;
        defaults.dom.footer.content[0].content[0].content[0].id = defaults.ids.input + that.dateValue;
        defaults.dom.footer.content[0].content[0].content[1].content[0].id = defaults.ids.send + that.dateValue;
        /* 国际化设置,默认是中文简体*/
        if(language && defaults.language[language]){
            language = defaults.language[language];
            defaults.dom.head.content[1].text = language.head_title;
            defaults.dom.body.content[0].content[0].content[1].content[0].content[0].content[0].text = language.sys_Name;
            defaults.dom.body.content[0].content[0].content[1].content[1].text = language.welcome;
//            defaults.dom.body.content[0].content[0].content[0].content[0].property.alt = language.sys_img_alt;
            defaults.dom.footer.content[0].content[0].content[0].property.placeholder = language.sender_placeholder;
            defaults.dom.footer.content[0].content[0].content[1].content[0].text = language.sender_text;
        }
        defaults = $.extend(true, defaults, options);
        return defaults;
    }

    /**
     * 判断一个Object是否为空
     * @param e
     * @returns {boolean}
     * @private
     */
    var __isEmpty = function(e){
        var obj;
        for(obj in e){
            return false;
        }
        return true;
    }

    /**
     * 根据options生成dom树
     * @param data
     * @returns dom
     */
    var getDom = function(data){
        var dom = $(data.item) ;
        data.id ? dom.attr("id", data.id) : undefined;
        data.class ? dom.addClass(data.class) : undefined;
        data.style ? dom.attr("style",data.style) : undefined;
        data.text ? dom.text(data.text) : undefined;
        var property = data.property;
        var exProperty = data.exProperty;
        if(property){
            var i;
            for(i in property){
                dom.attr(i,property[i]);
            }
        }
        if(exProperty){
            var j;
            for(j in exProperty){
                dom.attr(j.replace(/_/g,'-'),exProperty[j]);
            }
        }
        if(!__isEmpty(data.content)){
            $.each(data.content, function(i, obj){
                dom.append(getDom(obj));
            })
        }
        return dom;
    }

    /**
     * 初始化BootstrapChat
     * @param options 用户设置的参数
     * @param language 语言默认为cn（汉语），还有一个可选项是en（英语）
     * @returns dom chat完整dom结构
     */
    BootstrapChat.prototype.init = function(options){
        this.$jq_ = this.$jq_ ||  $('<div>');
        options = getOptions(this, options, this.language);
        var head = options.dom.head;
        var body = options.dom.body;
        var footer = options.dom.footer;
        this.$jq_.attr("class",options.dom.class);
        var $head =getDom(head);
        var $body = getDom(body);
        var $footer = getDom(footer);
        this.$jq_.append($head).append($body).append($footer);
        this.initSend();
        this.initOpt();
//        this.initRefresh();
//        this.initBusy();
//        this.initLeave();
//        this.initOnline;
//        this.initLogout();
        this.initWebsocket();
        return this.$jq_;
    }

    var onmessage = function(event, that){
        var data=JSON.parse(event.data);
        data.img = data.img || DEFAULTS.sender.sender;
        if(data.msg_type)
        {
            switch (data.msg_type){
                case 1:
                    //心跳信息
                    break;
                case 100:
                    addNormalMessages();
                    break;
                case 110:
                    console.log();
                    break;
                case 111://清除指令
                    //
                    break;
                case 114:
                    intiListMessages(data,that);
                    break;
                case 118://取得聊天记录
                    console.log();
                    break;
                case 119:
                    //system manage
                    break;
                case 301:
                    //财务审核消息
                    break;
            }
        }
        if(data.msg_type == 110){
            that.addSysMessages(data);
        }else if(data.msg_type == 118){ // 初始化数据
            that.clear();
            var uls = data.uls;
            var uid = data.uid;
            $.each(uls, function(i, obj){
                if(obj.sid == uid){
                    obj.sender = '我';
                    that.addMessages(obj, true)
                }else{
                    obj.img = DEFAULTS.sender.checker;
                    that.addMessages(obj, true)
                }
            })
        }else{
            that.addMessages(data, false);
        }
        if(typeof that.onmessage === 'function'){
            that.onmessage(event);
        }
    }

    var addNormalMessages = function(that){

    }

    var intiListMessages = function(data, that){
        that.clear();
        var uls = data.uls;
        var uid = data.uid;
        $.each(uls, function(i, obj){
            if(obj.sid == uid){
                obj.sender = '我';
                that.addMessages(obj, true)
            }else{
                obj.img = DEFAULTS.sender.checker;
                that.addMessages(obj, true)
            }
        })
    }

    BootstrapChat.prototype.initWebsocket = function(){
        if(this.url){
            if(!(this.websocket && this.websocket.readyState === 1)){
                if(this.websocket){
                    try{
                        this.websocket.close();
                    }catch(e){
                        alert("websocket 连接失败，请重试。");
                    }
                }
                try{
                    if ('WebSocket' in window) {
                        this.websocket = new WebSocket("ws://" + this.url);
                    } else if ('MozWebSocket' in window) {
                        this.websocket = new MozWebSocket("ws://" + this.url);
                    } else {
                        this.websocket = new SockJS("http://" + this.url);
                    }
                    times = 0;
                }catch(e){
                    alert("websocket 连接失败，请重试。");
                }
            }
            var that = this;
            //打开一个链接
            this.websocket.onopen = function(event) {
                var msg = {};
                msg.msg = "WebSocket:已连接";
                that.addSysMessages(msg);
                times = 0;
//                console.log(event);
                if(typeof that.onopen === 'function'){
                    that.onopen(event);
                }
            };

            //消息接收
            this.websocket.onmessage = function(event) {
//                var data=JSON.parse(event.data);
//                data.img = data.img || DEFAULTS.sender.sender;
//                data.msg_type = data.msg_type || 100;
//                if(data.msg_type == 110){
//                    that.addSysMessages(data);
//                }else if(data.msg_type == 114){ // 初始化数据
//                    that.clear();
//                    var uls = data.uls;
//                    var uid = data.uid;
//                    $.each(uls, function(i, obj){
//                        if(obj.sid == uid){
//                            obj.sender = '我';
//                            that.addMessages(obj, true)
//                        }else{
//                            obj.img = DEFAULTS.sender.checker;
//                            that.addMessages(obj, true)
//                        }
//                    })
//                }else{
//                    that.addMessages(data, false);
//                }
                if(typeof that.onmessage === 'function'){
                    that.onmessage(event);
                }else{
                    var data=JSON.parse(event.data);
                    data.img = data.img || DEFAULTS.sender.sender;
                    data.msg_type = data.msg_type || 100;
                    that.addMessages(data, false);
                }
            };
            //发生错误
            this.websocket.onerror = function(event) {
                var msg = {};
                msg.msg = "WebSocket发生错误:" + event.type;
                that.addSysMessages(msg);
                if(times ++ < MAXTIMES){
                    setTimeout(that.initWebsocket,1000);
                }else{
                    alert("无法重连聊天服务器，可能是您登陆超时。");
                }
                if(typeof that.onerror === 'function'){
                    that.onerror(event);
                }
            };
            //关闭事件
            this.websocket.onclose = function(event) {
                var msg = {};
                msg.msg = "WebSocket:已关闭";
                that.addSysMessages(msg);
                if(times ++ < MAXTIMES){
                    setTimeout(that.initWebsocket,1000);
                }else{
                    alert("无法重连聊天服务器，可能是您登陆超时。")
                }
//                that.initWebsocket();
                if(typeof that.onclose === 'function'){
                    that.onclose(event);
                }
            }
        }else{
            console.log("没有设置url值，websocket没有初始化。");
        }
    }

    BootstrapChat.prototype.reconnected = function(){
        try{
            this.disconnected();
            this.initWebsocket();
        }catch(e){
            console.log("断开连接失败。")
        }
    }

    BootstrapChat.prototype.disconnected = function(){
        try{
            this.websocket.close();
        }catch(e){
            throw e;
        }
    }

    BootstrapChat.prototype.websocket_send = function(msg){
        if(this.websocket && this.websocket.readyState === 1){
            this.websocket.send(JSON.stringify(msg));
        }else{
            this.initWebsocket();
        }
    }

    /**
     * 直接生成Bootstrap Chat dom 树结构
     * @param options
     * @private
     */
    BootstrapChat.prototype._init = function(options){
        options = $.extend(true,{}, this.DEFAULTS, options);
        this.$jq_.attr('class','');
        this.$jq_.addClass(options.bsClass).addClass(options.class);
        //head
        var head = $('<div>').addClass(options.head.class).append($('<i>').addClass(options.head.iconCls)).append($('<span>').text(options.head.text));
        if(options.head && options.head.style){
            head.attr('style',options.head.style);
        }
        this.$jq_.append(head);
        //body
        var body = $('<div>').addClass(options.body.class);
        if(options.body && options.body.style){
            body.attr("style", options.body.style);
        }
        var ul = $('<ul>').addClass(options.ul.class)
        ul.appendTo(body);
        this.$jq_.append(body);
        //footer
        var footer = $('<div>').addClass('panel-footer');
        var form = $('<form>');
        var input_group = $('<div>').addClass('input-group')
                .append($('<input>').addClass('form-control input-sm').attr('type','text').attr('name',this.DEFAULTS.app_data._comments).attr('placeholder',this.DEFAULTS.sender.placeholder))
                .append($('<span class="input-group-btn">'))
                .append($('<button role="button" class="btn btn-warning btn-sm" app-action="caiwu.baoxiaoCheck.sendMessager">发送</button>'));
        this.$jq_.append(input_group);
        this.$jq.after(this.$jq_);
        this.$jq.remove();
        this.$jq_.data("BootstrapChat.data",this.$jq_);
    };

    /**
     * 添加一条聊天记录
     * @param msg
     * @returns {*}
     * @private
     */
    BootstrapChat.prototype.addMessages = function(msg, ifself){
        if(!msg.img){
            msg.img = ifself ? $.extend({},DEFAULTS.sender.me) : $.extend({},DEFAULTS.sender.sender);
        }
        if(!msg || !msg.msg) return ;
        $('#' + DEFAULTS.ids.input + this.dateValue).val('');
        if(!this.$jq_.data("BootstrapChat.data")){
            this.$jq_.data("BootstrapChat.data",{})
        }
        var data = this.$jq_.data("BootstrapChat.data") ;
        data.ul = data.ul || [];
        var index = data.ul.length;
//        if(isEmpty(msg)){
//            return false;
//        }
        var li = $('<li>').addClass(ifself ? 'left clearfix':'right clearfix').attr("chat-id",index);
        li.append($('<span>').append($('<img>').attr('src',msg.img.src).attr('alt',msg.img.alt ? msg.img.alt : "imgs").
                addClass(msg.img.class ? msg.img.class : "img-circle")).addClass(ifself ? 'chat-img pull-left':'chat-img pull-right'));
        li.append($('<div>').addClass('chat-body clearfix').append(
                $('<div>').addClass('header').append($('<strong>').addClass(ifself ? 'primary-font':'pull-right primary-font').text(ifself ? '我' : msg.sender)).
                        append($('<small>').addClass(ifself ? 'pull-right text-muted':' text-muted').append($('<i>').addClass('fa fa-clock-o fa-fw')).append($('<span>').text(msg.date)))
        ).append($('<p>').text(msg.msg)))
        try{
//            li.appendTo(this.$jq_);
            li.appendTo(this.$jq_.find("div.panel-body>ul.chat"));
            this.$jq_.find(".panel-body").scrollTop(this.$jq_.find(".panel-body")[0].scrollHeight);
            data.ul.push({data:msg,dom:li});
        }catch(e){
            console.log("插入消息失败或滚动消息框失败：%o",e);
        }
        return li ;
    }

    BootstrapChat.prototype.removeMessages = function(index){
        if(!index) return false;
        try{
            ul = this.$jq_.data("BootstrapChat.data").ul;
            if(ul && ul.length > index){
                ul[index].dom.remove();
            }
        }catch(e){
            $.messager.alert("系统提示","删除出错："+ e.toString());
        }
    }

    BootstrapChat.prototype.clear = function(){
        ul = this.$jq_.data("BootstrapChat.data").ul;
        this.$jq_.find('#'+DEFAULTS.ids.chat_ul+this.dateValue + ">li").remove();
        $.each(ul, function(i, obj){
            obj.dom.remove();
//            ul.pop(i);
        })
        ul = [];
    };

    BootstrapChat.prototype.addSysMessages = function(msg){
        if(!msg || !msg.msg) return ;
        msg.img = DEFAULTS.sender.system;
        var data = this.$jq_.data("BootstrapChat.data") ;
        if(!data) return ;
        data.ul = data.ul || [];
        var index = data.ul.length;
//        if(isEmpty(msg)){
//            return false;
//        }
        var li = $('<li>').addClass('right clearfix').attr("chat-id",index);
        li.append($('<span>').append($('<img>').attr('src',msg.img.src).attr('alt',msg.img.alt ? msg.img.alt : "imgs").
                addClass(msg.img.class ? msg.img.class : "img-circle")).addClass('chat-img pull-right'));
        li.append($('<div>').addClass('chat-body clearfix').append(
                $('<div>').addClass('header').append($('<strong>').addClass('pull-right primary-font').html('<span style="color:#ff6a00">[系统消息]:</span>')).
                        append($('<small>').addClass('text-muted').append($('<i>').addClass('fa fa-clock-o fa-fw')).append($('<span>').text(msg.date || new Date().format__(this.datePattern))))
        ).append($('<p>').text(msg.msg)))
        try{
            li.appendTo(this.$jq_.find("div.panel-body>ul.chat"));
            this.$jq_.find(".panel-body").scrollTop(this.$jq_.find(".panel-body")[0].scrollHeight);
        }catch(e){
            console.log("插入消息失败或滚动消息框失败：%o",e);
        }
        return li ;
    }

    /**
     * 发送消息
     * @private
     */
    BootstrapChat.prototype.sendMessages = function(msg){
//        if(!msg.id && !msg.msg_type) return false;
        if(!msg.id) return false;
        this.addMessages(msg,true);
        delete msg.img;
        this.websocket_send(msg);
    }

    BootstrapChat.prototype.initSend = function(){
        //绑定输入框的Enter键按下事件。
        var that = this;
        $('#' + DEFAULTS.ids.input + that.dateValue).on('keypress', function(event){
            event.stopImmediatePropagation();//停止冒泡
            var theEvent = event || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (13 === code) {
                $("#" + DEFAULTS.ids.send + that.dateValue).trigger('click');
            }
        })

        //绑定send发送事件
        $("#" + DEFAULTS.ids.send + that.dateValue).on('click', function(event){
            event.preventDefault();//关闭默认事件
            event.stopImmediatePropagation();//停止冒泡
            var msg = $('#' + DEFAULTS.ids.input + that.dateValue).val();
            var data = {};
            data.msg = msg;
            data.sender = "我";
            data.to = that.to;
            data.msg_type = that.msg_type;
            data.lis_id = that.lis_id;
            data.ownerId = that.ownerId;
            if(msg && msg.length>0 && data.msg_type){
                if(!that.regex.test(msg)){
                    if(that.websocket){
                        that.websocket_send(data);
                    }
                    data.img = DEFAULTS.sender.me;
                    data.date = new Date().format__(that.datePattern);
//                data.ifself = true;
                    that.addMessages(data, true);
                }
            }
        })
    };

    BootstrapChat.prototype.initOpt = function(){
        var dom = $('#' + DEFAULTS.ids.drop_ul + this.dateValue + ">li[chat-target]");
        var that =  this;
        dom.on('click', function(event){
            var $li = $(event.currentTarget);
            var target = $li.attr('chat-target');
            if(/refresh/g.test(target)){
                console.log('click refresh');
                if(typeof that.onClickRefresh === 'function'){
                    that.onClickRefresh_();
                }
            }else if(/online/g.test(target)){
                console.log('click online');
                if(typeof that.onClickOnline === 'function'){
                    that.onClickOnline_();
                }
            }else if(/busy/g.test(target)){
                console.log('click busy');
                if(typeof that.onClickBusy === 'function'){
                    that.onClickBusy_();
                }
            }else if(/leave/g.test(target)){
                console.log('click leave');
                if(typeof that.onClickLeave === 'function'){
                    that.onClickLeave_();
                }
            }else if(/logout/g.test(target)){
                console.log('click logout');
                if(typeof that.onClickLoginOut === 'function'){
                    that.onClickLoginOut_();
                }
            }
        })
    }

    BootstrapChat.prototype.addCookies = function(){

    };

    BootstrapChat.prototype.onClickSend = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickSend_ = callBack;
        }
    }

    BootstrapChat.prototype.onClickRefresh = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickRefresh_ = callBack;
        }
    }

    BootstrapChat.prototype.onClickOnline = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickOnline_ = callBack;
        }
    }

    BootstrapChat.prototype.onClickBusy = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickBusy_ = callBack;
        }
    }

    BootstrapChat.prototype.onClickLeave = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickLeave_ = callBack;
        }
    }

    BootstrapChat.prototype.onClickLoginOut = function(callBack){
        if(typeof callBack === 'function'){
            this.onClickLoginOut_ = callBack;
        }
    }

    $.fn.bootstrapChat = function(options, data, flag){
        var $this = $(this),
                chat = $this.data("BootstrapChat.data");
        if(typeof options === 'string'){
            this.each(function(){
                if(options === 'init' ||  !chat){
                    if(options === 'init' && chat){
                        console.log('元素已经初始化。')
                        chat = $.extend(chat, data);
                        if(!(chat.websocket && chat.websocket.readyState === 1)){
                            chat.reconnected();
                        }else  if(data.onopen && typeof data.onopen === 'function'){
                        	chat.clear();
                            data.onopen();
                        }
                        return ;
                    }
                    chat = new BootstrapChat($this, data);
                    $this.remove();
                    chat.$jq_.data("BootstrapChat.data", chat);
                    chat.init(data);
                }else if(chat[options]){
                    chat[options].call(chat, data, flag);
                }else{
                    throw new Error("Unknow method: " + options);
                }
            })
        }else if(typeof options === 'object'){

        }
    }
}(jQuery))