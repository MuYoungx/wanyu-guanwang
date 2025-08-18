const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();

// 关键：信任代理链（包括CDN和反向代理）
app.set('trust proxy', true);

// 中间件：解析表单数据
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 获取真实IP（适配CDN环境）
const getClientIp = (req) => {
    if (req.headers['x-forwarded-for']) {
        const ips = req.headers['x-forwarded-for'].split(',').map(ip => ip.trim());
        const validIps = ips.filter(ip => ip && !ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('172.'));
        if (validIps.length > 0) {
            return validIps[0].replace('::ffff:', '');
        }
    }

    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'].replace('::ffff:', '');
    }

    return req.connection.remoteAddress?.replace('::ffff:', '') || 'unknown';
};

// 允许跨域（注意：如果Nginx已配置CORS，可注释此段避免冲突）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 【新增】IP提交记录管理
const ipSubmitRecord = {}; // 格式: { "ip地址": { count: 提交次数, lastSubmit: 最后提交时间, isBlocked: 是否封禁, blockEndTime: 封禁结束时间 } }
const ALLOWED_SUBMITS = 2; // 允许提交次数
const BLOCK_DURATION = 5 * 60 * 1000; // 封禁时长（5分钟，单位：毫秒）

// 钉钉机器人Webhook地址
const DINGTALK_WEBHOOK = "https://oapi.dingtalk.com/robot/send?access_token=ab3d7ded70d27a17733850fc8ca3b9a629a103964eb4bcd7e4d3928780611a48";

// 接收表单数据并转发到钉钉的路由
app.post('/submit-to-dingtalk', async (req, res) => {
    try {
        // 【新增】获取客户端IP并检查限流状态
        const clientIp = getClientIp(req);
        const now = Date.now();
        
        // 初始化IP记录（若不存在）
        if (!ipSubmitRecord[clientIp]) {
            ipSubmitRecord[clientIp] = {
                count: 0,
                lastSubmit: 0,
                isBlocked: false,
                blockEndTime: 0
            };
        }
        const ipRecord = ipSubmitRecord[clientIp];

        // 检查是否处于封禁状态
        if (ipRecord.isBlocked) {
            // 计算剩余封禁时间
            const remainingTime = Math.ceil((ipRecord.blockEndTime - now) / 1000);
            if (remainingTime > 0) {
                console.log(`IP ${clientIp} 处于封禁中，剩余 ${remainingTime} 秒`);
                return res.status(429).json({
                    success: false,
                    code: 429,
                    message: `提交过于频繁，已被临时限制，${remainingTime}秒后可再次尝试`
                });
            } else {
                // 封禁时间已过，重置记录
                ipRecord.count = 0;
                ipRecord.isBlocked = false;
                ipRecord.blockEndTime = 0;
            }
        }

        // 检查是否超过允许提交次数
        if (ipRecord.count >= ALLOWED_SUBMITS) {
            // 触发封禁
            ipRecord.isBlocked = true;
            ipRecord.blockEndTime = now + BLOCK_DURATION;
            console.log(`IP ${clientIp} 提交次数超过限制（${ALLOWED_SUBMITS}次），已封禁5分钟`);
            return res.status(429).json({
                success: false,
                code: 429,
                message: `提交过于频繁，已被临时限制，300秒后可再次尝试`
            });
        }

        // 字段非空验证
        const errors = [];
        const requiredFields = [
            { name: 'name', label: '姓名' },
            { name: 'phone', label: '电话' },
            { name: 'service', label: '感兴趣的服务' },
        ];

        // 验证必填字段
        requiredFields.forEach(field => {
            if (!req.body[field.name] || (typeof req.body[field.name] === 'string' && req.body[field.name].trim() === '')) {
                errors.push(`${field.label}不能为空`);
            }
        });

        // 验证邮箱格式（如果提供了邮箱）
        if (req.body.email && req.body.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.body.email.trim())) {
                errors.push('邮箱格式不正确');
            }
        }

        // 如果有验证错误，返回错误信息
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '提交失败，请检查以下问题：',
                errors: errors
            });
        }

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
            name: req.body.name.trim(),
            phone: req.body.phone.trim(),
            email: req.body.email ? req.body.email.trim() : '',
            company: req.body.company ? req.body.company.trim() : '',
            service: serviceMap[req.body.service] || req.body.service.trim(),
            message: req.body.message ? req.body.message.trim() : '',
            agreement: '已同意'
        };

        // 生成18位随机ID
        const randomId = crypto.randomBytes(9).toString('hex');
        
        // 构建钉钉消息
        const message = `来自官网的咨询提交：\n唯一id：${randomId}\n姓名：${formData.name}\n电话：${formData.phone}\n邮箱：${formData.email}\n公司名称：${formData.company}\n感兴趣的服务：${formData.service}\n咨询内容：${formData.message}\n隐私协议：${formData.agreement}\n提交时间：${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

        // 打印钉钉消息内容
        console.log('钉钉消息内容:', message);

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

        // 【新增】更新提交记录（成功提交后才计数）
        ipRecord.count += 1;
        ipRecord.lastSubmit = now;
        console.log(`IP ${clientIp} 第 ${ipRecord.count} 次提交成功`);

        res.json({ 
            success: true,
            code: 200,      
            message: "提交成功，我们会尽快联系您！"  
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            code: 500,
            error: error.message || '服务器内部错误' 
        });
    }
});

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});