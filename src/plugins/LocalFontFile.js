import Phaser from 'phaser'

export default class LocalFontFile extends Phaser.Loader.File {
 /**
  * @param {Phaser.Loader.LoaderPlugin} loader
  * @param {string} key - Уникальный ключ для шрифта
  * @param {string} fontFamily - Название шрифта
  * @param {string} fontPath - Путь к файлу шрифта
  */
 constructor(loader, key, fontFamily, fontPath) {
  super(loader, {
   type: 'localFont',
   key: key
  });
  
  this.fontFamily = fontFamily;
  this.fontPath = fontPath;
 }
 
 load() {
  // Создаем @font-face
  const fontFace = new FontFace(this.fontFamily, `url(${this.fontPath})`);
  
  
  // Загружаем шрифт
  fontFace.load().then((loadedFace) => {
   // Добавляем шрифт в document.fonts
   document.fonts.add(loadedFace);
   
   // Сообщаем загрузчику Phaser, что файл загружен
   this.loader.nextFile(this, true);
  }).catch((error) => {
   this.loader.nextFile(this, false);
   
   console.error('Failed to load font:', error);
  });
 }
}