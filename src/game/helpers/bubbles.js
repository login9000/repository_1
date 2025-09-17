class Bubbles {
    static breakLongWords(text, maxLength = 20) {
        return text.split(' ').map(word => {
            if (word.length <= maxLength) {
                return word;
            }
            return word.match(new RegExp(`.{1,${maxLength}}`, 'g')).join('- ');
        }).join(' ');
    }

}

export default Bubbles;