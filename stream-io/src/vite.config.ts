const filename = filePath.split('/').pop();
if (filename && filename.includes('.')) {
  return filename.replace(/\.[^/.]+$/, '');
}
return 'unknown';
}, 