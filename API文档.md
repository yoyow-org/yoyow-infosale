[TOC]
##yoyow1.2 API
 by 马小明
### 1.查看标题
<pre>
<code>
用   途：查看标题以及标题所含规则
地   址：/title/:uid
method：get
参   数：
		uid - yoyow账号
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "查询成功",//code为5000 返回错误原因
	"data": {
		"title": "wwwwwww",
		"uid": "4550155",
		"data": [{
			"id": 1,
			"account": "4550155",
			"title": "22",
			"content": "2",
			"amount": 2,
			"asset_id": 0,
			"expiration_date": null,
			"created_date": 1534129467922
		}, {
			"id": 2,
			"account": "4550155",
			"title": "33",
			"content": "33",
			"amount": 33,
			"asset_id": 0,
			"expiration_date": 1534129467922,
			"created_date": 1534129467922
		}]
	}//成功时返回数据或未找到数据时为null
}
</code>  
</pre>

###2.设置和修改标题
<pre>
<code>
用   途：设置和修改标题
地   址：/title
method：post
参   数：
		uid - yoyow账号
		title -标题 长度：20
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": null
}
</code>  
</pre>

###3.创建和修改规则
<pre>
<code>
用   途：创建和修改规则
地   址：/rule
method：post
参   数：
		rid - 规则id（创建时值为：0）
		uid - yoyow账号
		title - 标题 长度：20
		content - 规则内容 200
		amount - 支付金额 1000以内
		asset_id - 用于支付的资产id
		expiration_date - 过期时间
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": null
}
</code>  
</pre>

###4.删除规则
<pre>
<code>
用   途：删除规则
地   址：/rule/:rid
method：delete
参   数：
		rid - 规则id
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": null
}
</code>  
</pre>

###5.获取用户的订单
<pre>
<code>
用   途：获取用户的回复订单
地   址：/orders/:uid
method：get
参   数：uid - yoyow账号
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "查询成功",//code为5000 返回错误原因
	"data": [{
		"id": 1,
		"account": "4550155",
		"title": "wwwww",
		"content": "加密内容",
		"amount": 2,
		"asset_id":0,
		"pay_date": 1534129467922,
		"status": 1,//已转账
		"created_date": 1534129467922,
		"is_view":0//表示未查看
	}, {
		"id": 2,
		"account": "4550155",
		"title": "xxxxxxx",
		"content": "加密内容",
		"amount": 3,
		"asset_id":0,
		"pay_date": 1534129467922,
		"status": 1,//1.已转账
		"created_date": 1534129467922,
		"is_view":1//表示已查看
	}]//返回为空时，data:[]
}
</code>  
</pre>

###6.查看单条订单
<pre>
<code>
用   途：查看单条回复订单
地   址：/order/:rid
method：get
参   数：
		rid - 订单索引号
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "查询成功",//code为5000 返回错误原因
	"data": [{
		"id": 1,
		"account": "4550155",
		"title": "wwwww",
		"content": "加密内容",
		"amount": 2,
		"asset_id":0,
		"pay_date": 1534129467922
	}]//未查询到数据时，data:[]
}
</code>  
</pre>

###7.获取中间账号
<pre>
<code>
用   途：获取中间账号
地   址：/config
method：get
参   数：
		-
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "查询成功",//code为5000 返回错误原因
	"data": [{
		"account": "4550155"
	}]//未查询到数据时，data:[]
}

</code>  
</pre>

###8.获取api服务状态
<pre>
<code>
用   途：获取api服务状态
地   址：/
method：get|options
参   数：
		-
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "查询成功",//code为5000 返回错误原因
	"data": [{
		"status": "200"
	}]//未查询到数据时，data:[]
}
</code>  
</pre>

###9.删除订单
<pre>
<code>
用   途：删除订单
地   址：/order/:rid
method：delete
参   数：
		rid - 规则id
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": null
}
</code>  
</pre>

###10.添加订单
<pre>
<code>
用   途：添加订单
地   址：/order
method：post
参   数：
		rid - 规则id
		uid - 买方yoyow账号
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": {order_id:20181212103525234,amount:1000000,asset_id:0}
}
</code>  
</pre>

###11.导入账号
<pre>
<code>
用   途：导入账号(修改memo公钥，重新加密规则内容，重新加密订单内容)
地   址：/import
method：post
参   数：
		uid - yoyow账号
返   回：
{
	"code": "0",//成功：0，失败：5000
	"message": "操作成功",//code为5000 返回错误原因
	"data": null
}


code 对应
5000:"operation failed. please try again later";
5001:"the account is not allowed to be empty";
5002:"the title is not allowed to be empty";
5003:"the title's length must be no more than 20";
5004:"the amount must be no more than 10000";
5005:"the asset_id is not valid";
5006:"the expiration_date is not valid";
5007:"the rule id is not allowed to be empty";
5008:"the order id is not allowed to be empty";
5009:"the account is not valid";
5010:"the rule id is not valid";
5011:"the rules must be no more than 20 counts";
5012:"the title is not valid";
5013:"the rule name is not valid";
</code>  
</pre>