const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();

// 中间件：解析表单数据
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 允许跨域
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 钉钉机器人Webhook地址
const DINGTALK_WEBHOOK = "https://oapi.dingtalk.com/robot/send?access_token=55664a05dd328e90491b5c76efcd378eba468816a4ed5d095ed5e1e3012d2275";

// 接收表单数据并转发到钉钉的路由
app.post('/api/submit-to-dingtalk', async (req, res) => {
    try {
        // 打印接收到的表单数据
        console.log('接收到表单数据:', req.body);

        // 服务类型映射表
        const serviceMap = {
            'architecture': '云架构设计',
            'deployment': '云部署实施',
            'migration': '数据迁移服务',
            'operation': '云运维管理',
            'security': '云安全服务',
            'optimization': '云优化咨询',
            'software': '软件开发服务',
            'other': '其他服务'
        };

        // 提取表单数据
        const formData = {
            name: req.body.name || '',
            phone: req.body.phone || '',
            email: req.body.email || '',
            company: req.body.company || '',
            service: serviceMap[req.body.service] || req.body.service || '',
            message: req.body.message || '',
            agreement: '已同意'
        };

        // 生成18位随机ID
        const randomId = crypto.randomBytes(9).toString('hex');
        
        // 构建钉钉消息
        const message = `来自官网的咨询提交：\n唯一id：${randomId}\n姓名：${formData.name}\n电话：${formData.phone}\n邮箱：${formData.email}\n公司名称：${formData.company}\n感兴趣的服务：${formData.service}\n咨询内容：${formData.message}\n隐私协议：${formData.agreement}\n提交时间：${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

        // 打印钉钉消息内容
        console.log('钉钉消息内容:', message);

        // 使用固定Webhook地址

        // 发送到钉钉机器人
        console.log('正在调用钉钉机器人Webhook:', DINGTALK_WEBHOOK);
        const response = await fetch(DINGTALK_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                msgtype: "text",
                text: {
                    content: message
                }
            })
        });
        console.log('钉钉机器人Webhook调用结果:', response);

        // 返回结果
        res.json({ success: response.ok });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});