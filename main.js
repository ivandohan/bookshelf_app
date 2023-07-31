const books = [];
const book_search = [];
const RENDER_EVENT = 'render-book';
const RENDER_SEARCH_EVENT = 'search-render';
const STORAGE_KEY = 'BOOKSHELF_APPS';
const SAVED_EVENT = 'saved-book';

let searchActivityCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tab1').style.display = 'flex';
    document.getElementsByClassName('tab-button')[0].classList.add('active');

    const submitAddBook = document.getElementById('submitAddBookButton');
    submitAddBook.addEventListener('click', (event) => {
        event.preventDefault();
        addBookData();
    });

    const submitSearch = document.getElementById('submitSearchButton');
    submitSearch.addEventListener('click', (event) => {
        event.preventDefault();
        searchActivityCount = 0;
        book_search.splice(0);
        searchBook(document.getElementById('searchBookByTitle').value);
    });

    const closeSuccessModalButton = document.getElementById('close-add-success-modal-button');
    closeSuccessModalButton.addEventListener('click', () => {
        document.getElementById('add-success-modal').close();
    });

    const closeFailModalButton = document.getElementById('close-delete-success-modal-button');
    closeFailModalButton.addEventListener('click', () => {
        document.getElementById('delete-success-modal').close();
    });

    const closeUpdateModalButton = document.getElementById('close-update-success-modal-button');
    closeUpdateModalButton.addEventListener('click', () => {
        document.getElementById('update-success-modal').close();
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    }
});

const isStorageExist =  () => {
    if (typeof (Storage) === undefined) {
        alert('Browser kamu tidak mendukung local storage!');
        return false;
    }
    return true;
}

const saveData = () => {
    if (isStorageExist()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

const loadDataFromStorage = () => {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const book of data) {
            books.push(book);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

document.addEventListener(RENDER_EVENT, () => {
    const tBodyforUnread = document.getElementById('tBody-unread');
    const tBodyforAlreadyRead = document.getElementById('tBody-alreadyRead');

    tBodyforUnread.innerHTML = "";
    tBodyforAlreadyRead.innerHTML = "";

    setNoBooksYetDiv();

    for(const book of books) {
        const bookDataElement = makeBookAsDOM(book);
        
        if(book.isAlreadyRead) {
            tBodyforAlreadyRead.appendChild(bookDataElement);
        } else {
            tBodyforUnread.appendChild(bookDataElement);
        }
    }
});

document.addEventListener(RENDER_SEARCH_EVENT, () => {
    if(book_search.length < 1) {
        const notFoundDiv = document.getElementById('book-not-found');
        notFoundDiv.style.display = "flex";

        document.getElementById('search-result').style.display = "none";
        return;
    } else {
        const tBodyforSearchResult = document.getElementById('tBody-searchResult');
        tBodyforSearchResult.innerHTML = "";

        const notFoundDiv = document.getElementById('book-not-found');
        notFoundDiv.style.display = "none";

        document.getElementById('search-result').style.display = "flex";
        for(const book of book_search) {
            const bookDataElement = makeBookAsDOM(book);
            tBodyforSearchResult.appendChild(bookDataElement);
        }
    }
});


const generateId = () => {
    return +new Date();
}

const generateBookObject = (bookId, bookTitle, bookAuthor, bookYear, isAlreadyRead) => {
    return {
        bookId, bookTitle, bookAuthor, bookYear, isAlreadyRead,
    };
}

const addBookData = () => {
    const bookId = generateId();
    const bookTitle = document.getElementById('inputBookTitle').value;
    const bookAuthor = document.getElementById('inputBookAuthor').value;
    const bookYear = document.getElementById('inputBookYear').value;
    const isAlreadyRead = document.getElementById('isAlreadyRead').checked;

    const bookObject = generateBookObject(
        bookId, bookTitle, bookAuthor, bookYear, isAlreadyRead,
    );
    books.push(bookObject);

    document.dispatchEvent(new Event(RENDER_EVENT));

    saveData();

    document.getElementById('add-success-modal').showModal();

    if(isAlreadyRead) {
        openTab('tab2', null, 'tbtn-alreadyRead');
    } else {
        openTab('tab1', null, 'tbtn-unread');
    }
}


const searchBook = (keyword) => {
    searchActivityCount++;
    keyword = keyword.toLowerCase();
    for(const book of books) {
        if(book.bookTitle.toLowerCase().includes(keyword)) {
            book_search.push(book);
            continue;
        }

        if(book.bookAuthor.toLowerCase().includes(keyword)) {
            book_search.push(book);
            continue;
        }

        if(book.bookYear.includes(keyword)) {
            book_search.push(book);
            continue;
        }
    }

    document.dispatchEvent(new Event(RENDER_SEARCH_EVENT));
}

const makeBookAsDOM = (bookObject) => {

    let row = document.createElement('tr');
    for(const props in bookObject) {
        let rowData = document.createElement('td');
        if(props == "bookId" || props == "isAlreadyRead") continue;

        rowData.innerText = bookObject[props];

        row.appendChild(rowData);
    }
    
    const tableButtonsDiv = document.createElement('div');
    tableButtonsDiv.classList.add('table-action-buttons');

    if(bookObject.isAlreadyRead) {
        const undoButton = document.createElement('button');
        undoButton.classList.add('undo-button');
        undoButton.innerText = "Undo";

        undoButton.addEventListener('click', () => {
            undoBookFromAlreadyRead(bookObject.bookId);
        });

        const trashButton = document.createElement('button');
        trashButton.classList.add('trash-button');
        trashButton.innerText = "Hapus"

        trashButton.addEventListener('click', () => {
            removeBookFromList(bookObject.bookId);
        });

        tableButtonsDiv.append(undoButton, trashButton);
        const buttonCell = document.createElement('td');
        buttonCell.append(tableButtonsDiv);
        row.append(buttonCell);

    } else {
        const readButton = document.createElement('button');
        readButton.classList.add('read-button');
        readButton.innerText = "Mark as Read";

        readButton.addEventListener('click', () => {
            addBookAsAlreadyRead(bookObject.bookId);
        });

        const trashButton = document.createElement('button');
        trashButton.classList.add('trash-button');
        trashButton.innerText = "Hapus";

        trashButton.addEventListener('click', () => {
            removeBookFromList(bookObject.bookId);
        });

        tableButtonsDiv.append(readButton, trashButton);
        const buttonCell = document.createElement('td');
        buttonCell.append(tableButtonsDiv);
        row.append(buttonCell);
    }

    return row;
}

const findBook = (id) => {
    for(const book of books) {
        if(book.bookId == id) {
            return book;
        }
    }

    return null;
}

const findBookIndex = (id) => {
    for(const i in books) {
        if(books[i].bookId == id) {
            return i;
        }
    }

    return -1;
}

const findSearchIndex = (id) => {
    for(const i in book_search) {
        if(book_search[i].bookId == id) {
            return i;
        }
    }

    return -1;
}

const addBookAsAlreadyRead = (id) => {
    const target = findBook(id);

    if(target == null) return;

    target.isAlreadyRead= true;
    document.dispatchEvent(new Event(RENDER_EVENT));

    if(searchActivityCount != 0) {
        document.dispatchEvent(new Event(RENDER_SEARCH_EVENT));
    }

    document.getElementById('update-success-modal').showModal();

    saveData();
}

const undoBookFromAlreadyRead = (id) => {
    const target = findBook(id);

    if(target === null) return;

    target.isAlreadyRead = false;
    document.dispatchEvent(new Event(RENDER_EVENT));

    if(searchActivityCount != 0) {
        document.dispatchEvent(new Event(RENDER_SEARCH_EVENT));
    }

    document.getElementById('update-success-modal').showModal();

    saveData();
}

const removeBookFromList = (id) => {
    const target = findBookIndex(id);
    const searchTarget = findSearchIndex(id);

    if(target == -1) return;

    books.splice(target, 1);

    if(searchTarget != -1) book_search.splice(searchTarget, 1);

    document.dispatchEvent(new Event(RENDER_EVENT));

    if(searchActivityCount != 0) {
        document.dispatchEvent(new Event(RENDER_SEARCH_EVENT));
    }

    document.getElementById('delete-success-modal').showModal();

    saveData();
}





const setNoBooksYetDiv = () => {
    let unreadCount = 0;
    let alreadyReadCount = 0;
    for(const book of books) {
        if(book.isAlreadyRead) {
            alreadyReadCount++;
        } else {
            unreadCount++;
        }
    }

    if(unreadCount === 0) {
        document.getElementById('unread-table').style.display = "none";
        document.getElementById('no-unread-books-yet').style.display = "block";
    } else {
        document.getElementById('unread-table').style.display = "block";
        document.getElementById('no-unread-books-yet').style.display = "none";
    }
    
    if(alreadyReadCount === 0) {
        document.getElementById('alreadyRead-table').style.display = "none";
        document.getElementById('no-alreadyRead-books-yet').style.display = "block";
    } else {
        document.getElementById('alreadyRead-table').style.display = "block";
        document.getElementById('no-alreadyRead-books-yet').style.display = "none";
    }
}

const openTab = (tabName, eventTarget, buttonId) => {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    document.getElementById(tabName).style.display = "flex";

    if(eventTarget != null) {
        eventTarget.currentTarget.classList.add('active');
    } else if(buttonId != null) {
        const selectedButton = document.getElementById(buttonId);
        selectedButton.classList.add('active');
    }
}