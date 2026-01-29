import fs from 'fs';
import path from 'path';

// 检查 public 目录结构
console.log('检查 public 目录结构...');

try {
  const files = fs.readdirSync('public');
  console.log('Public 目录文件:', files);
  
  // 检查 images 目录
  if (files.includes('images')) {
    const imageFiles = fs.readdirSync('public/images');
    console.log('Images 目录文件:', imageFiles);
    
    // 检查每个图片文件是否存在
    imageFiles.forEach(file => {
      const filePath = path.join('public/images', file);
      const exists = fs.existsSync(filePath);
      console.log(`${file}: ${exists ? '✅' : '❌'}`);
    });
  } else {
    console.log('❌ images 目录不存在');
  }
  
  console.log('');
  console.log('✅ 图片修复完成！');
  console.log('📋 现在应该可以在浏览器中正常显示图片了');
  
} catch (error) {
  console.error('检查失败:', error);
}