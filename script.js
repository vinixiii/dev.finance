const html = document.querySelector("html")
const checkbox = document.querySelector("input[name=theme]")

const getStyle = (element, style) => 
    window
        .getComputedStyle(element)
        .getPropertyValue(style)

const initialColors = {
    bg: getStyle(html, "--bg"),
    bgWhite: getStyle(html, "--bg-white"),
    colorHeadings: getStyle(html, "--color-headings"),
    darkBlue: getStyle(html, "--dark-blue"),
    green: getStyle(html, "--green"),
    bgHeader: getStyle(html, "--bg-header"),
    fontTable: getStyle(html, "--font-table"),
    greenButton: getStyle(html, "--green-button"),
    transButton: getStyle(html, "--trans-button"),
    hover: getStyle(html, "--hover"),
    fontForm: getStyle(html, "--font-form")
}

const darkMode = {
    colorHeadings: "#2F3437",
    bg: "#2F3437",
    bgWhite: "#3F4447",
    darkBlue: "#ffffff",
    green: "#363f5f",
    bgHeader: "#363f5f",
    fontTable: "#ffffff",
    greenButton: "#43517f",
    transButton: "#ffffff",
    hover: "#c4c4c4",
    fontForm: "#ffffff"
}

const transformKey = key => 
    "--" + key.replace(/([A-Z])/, "-$1").toLowerCase()


const changeColors = (colors) => {
    Object.keys(colors).map(key => 
        html.style.setProperty(transformKey(key), colors[key]) 
    )
}

checkbox.addEventListener("change", ({target}) => {
    target.checked ? changeColors(darkMode) : changeColors(initialColors)
})

const Modal = {
  open() {
    //Abrir modal
    //Adicionar a class active ao modal
    document.querySelector(".modal-overlay").classList.add("active");
  },
  close() {
    //Fechar modal
    //Remover a class active do modal
    document.querySelector(".modal-overlay").classList.remove("active");
  }
};

//Armazenando os dados no LocalStorage
const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('dev.finances:transactions')) || [];
    },
    set(transaction) {
        localStorage.setItem('dev.finances:transactions', JSON.stringify(transaction));
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {
        Transaction.all.push(transaction);

        App.reload();
    },

    remove(index) {
        Transaction.all.splice(index, 1);

        App.reload();
    },

    incomes(){
        let income = 0;

        //Para cada transação
        Transaction.all.forEach(transaction => {
            //Se > 0
            if(transaction.amount > 0) {
                //Somar a uma variável
                income += transaction.amount;
            }
        })

        //Retornar a variável com a soma feita
        return income;
    },

    expenses() {
        let expense = 0;

        //Para cada transação
        Transaction.all.forEach(transaction => {
            //Se > 0
            if(transaction.amount < 0) {
                //Somar a uma variável
                expense += transaction.amount;
            }
        })

        //Retornar a variável com a soma feita
        return expense;
    },

    total() {
        return Transaction.incomes() + Transaction.expenses();
    }
};

const Utils = {
    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : "";

        value = String(value).replace(/\D/g, "");

        value = Number(value) / 100;

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value;
    },

    formatAmount(value) {
        value = value * 100;
        
        return Math.round(value);
    },

    formatDate(date) {
        const splittedDate = date.split("-");
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    }
};

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr');
        tr.innerHTML = DOM.innetHTMLTransaction(transaction, index);
        tr.dataset.index = index;

        DOM.transactionsContainer.appendChild(tr);
    },

    innetHTMLTransaction(transaction, index) {
        //If ternário para definir a classe css que o amount irá receber. Se > 0 recebe "income", senão recebe "expense".
        const CSSclass = transaction.amount > 0 ? "income" : "expense";

        //Formatação da moeda
        const amount = Utils.formatCurrency(transaction.amount);

        const html = `
        <td class="description">${transaction.description}</td>
        <td class="${CSSclass}">${amount}</td>
        <td class="date">${transaction.date}</td>
        <td><img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação"></td>
        `

        return html;
    },

    updateBalance() {
        document.getElementById('incomeDisplay').innerHTML = Utils.formatCurrency(Transaction.incomes());
        document.getElementById('expenseDisplay').innerHTML = Utils.formatCurrency(Transaction.expenses());
        document.getElementById('totalDisplay').innerHTML = Utils.formatCurrency(Transaction.total());

        //Mudar background do total para vermelho caso o saldo seja negativo
        let cardTotal = document.querySelector('.card.total')

        if(document.getElementById('totalDisplay').innerHTML.includes("-")) {
            cardTotal.style.background = '#e92929';
        } else {
            cardTotal.style.background = '#49aa26';
        }
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = "";
    }
};

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        };
    },

    validateFields() {
        //Isso é uma desestruturação, 
        //ou seja, retira do objeto os valores
        //dos argumentos solicitados na const.
        const {description, amount, date} = Form.getValues();

        if(description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error('Por favor, preencha todos os campos!');
        }
    },

    formatValues() {
        let {description, amount, date} = Form.getValues();
        
        amount = Utils.formatAmount(amount);

        date = Utils.formatDate(date);

        return {
            description, amount, date
        }
    },

    clearFields() {
        Form.description.value = "";
        Form.amount.value = "";
        Form.date.value = "";
    },

    submit(event) {
        event.preventDefault();

        //Capturar o erro
        try {
            //Verificar se todos os campos foram preenchidos
            Form.validateFields();
    
            //Formatar os dados
            const transaction = Form.formatValues();

            //Salvar / Adcionar transação
            Transaction.add(transaction);

            //Limpar os campos
            Form.clearFields();

            //Fechar Modal
            Modal.close();
        } catch (error) {
            alert(error.message);
        }
    }
};

const App = {
    init() {
        //Adiciona todas as transações no HTML
        Transaction.all.forEach((transaction, index) => {
            DOM.addTransaction(transaction, index);
        });

        //Faz o update dos Cards
        DOM.updateBalance();

        Storage.set(Transaction.all);
    },

    reload() {
        DOM.clearTransactions();
        App.init();
    }
};

App.init();