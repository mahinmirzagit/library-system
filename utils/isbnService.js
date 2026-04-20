const axios = require('axios');

/**
 * Service to fetch book metadata from Google Books API by ISBN.
 * @param {string} isbn - The ISBN-10 or ISBN-13 of the book.
 * @returns {Promise<Object>} - The formatted book metadata.
 */
async function fetchBookByISBN(isbn) {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`;
    
    try {
        const response = await axios.get(url);
        
        if (response.data.totalItems === 0) {
            throw new Error('No book found with this ISBN.');
        }

        const info = response.data.items[0].volumeInfo;
        
        return {
            title: info.title || 'Unknown Title',
            author: info.authors ? info.authors.join(', ') : 'Unknown Author',
            genre: info.categories ? info.categories.join(', ') : 'Unknown Genre',
            publication_year: info.publishedDate ? info.publishedDate.split('-')[0] : null,
            description: info.description || '',
            cover_image: info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/150x200?text=No+Cover',
            isbn: cleanISBN
        };
    } catch (error) {
        console.error('Google Books API Error:', error.message);
        throw error;
    }
}

module.exports = { fetchBookByISBN };
