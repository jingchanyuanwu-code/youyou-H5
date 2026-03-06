-- 呦呦医生端数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS youyou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youyou;

-- 医生表
CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  title VARCHAR(50) COMMENT '职称',
  hospital VARCHAR(100) COMMENT '医院',
  department VARCHAR(50) COMMENT '科室',
  avatar VARCHAR(255) COMMENT '头像URL',
  phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  bindCode VARCHAR(50) UNIQUE COMMENT '个人绑定码',
  isWhitelisted BOOLEAN DEFAULT TRUE COMMENT '是否在白名单',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 患者表
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  age INT COMMENT '年龄',
  phone VARCHAR(20) COMMENT '手机号',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 医患绑定关系表
CREATE TABLE IF NOT EXISTS doctor_patient_rel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctorId INT NOT NULL,
  patientId INT NOT NULL,
  bindTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  FOREIGN KEY (doctorId) REFERENCES doctors(id),
  FOREIGN KEY (patientId) REFERENCES patients(id),
  UNIQUE KEY unique_relation (doctorId, patientId)
);

-- 活动配置表
CREATE TABLE IF NOT EXISTS activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '活动名称',
  linkTemplate VARCHAR(500) NOT NULL COMMENT '链接模板',
  isActive BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  startTime DATETIME COMMENT '开始时间',
  endTime DATETIME COMMENT '结束时间',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expiredAt DATETIME NOT NULL,
  isUsed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO doctors (name, title, hospital, department, phone, bindCode, isWhitelisted) VALUES
('张医生', '主任医师', '北京协和医院', '心内科', '13800138000', 'BIND001', TRUE),
('李医生', '副主任医师', '上海瑞金医院', '神经内科', '13900139000', 'BIND002', TRUE);

INSERT INTO patients (name, gender, age, phone) VALUES
('王小明', 'male', 35, '13700137001'),
('李小红', 'female', 28, '13700137002'),
('张大伟', 'male', 45, '13700137003'),
('刘芳', 'female', 52, '13700137004'),
('陈强', 'male', 38, '13700137005');

INSERT INTO doctor_patient_rel (doctorId, patientId) VALUES
(1, 1), (1, 2), (1, 3),
(2, 3), (2, 4), (2, 5);

INSERT INTO activities (name, linkTemplate, isActive) VALUES
('2024健康管理计划', 'https://youyou.com/activity/health2024?doctor={doctorId}&code={bindCode}', TRUE),
('慢病随访活动', 'https://youyou.com/activity/chronic?doctor={doctorId}', TRUE);
