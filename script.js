const Modal = {
    open(value){
        document
        .querySelector(value)
        .classList
        .add("active")
    },
    close(value){
        document
        .querySelector(value)
        .classList
        .remove("active")
    },

}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },
    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

const Transaction = {
    all: Storage.get(),
    add(transaction) {
        Transaction.all.push(transaction)
        App.reload()
    },
    remove(index) {
        Transaction.all.splice(index, 1)
        App.reload()
    },
    incomes() {
        let income = 0
        Transaction.all.forEach((transaction) => {
            if(transaction.amount > 0) {
                income += transaction.amount
            }
        })
        return income
    },
    expenses() {
        let expense = 0
        Transaction.all.forEach((transaction) => {
            if(transaction.amount < 0) {
                expense += transaction.amount
            }
        })
        return expense
    },
    total() {
        return Transaction.incomes() + Transaction.expenses()
    }
}

const Options = {
    optionsContainer: {
        all: document.querySelector("#label-1"),
        income: document.querySelector("#label-2"),
        expense: document.querySelector("#label-3")
    },
    getValue() {
        return {
            all: Options.optionsContainer.all.value,
            income: Options.optionsContainer.income.value,
            expense: Options.optionsContainer.expense.value
        }
    },
    selectAll() {
        Options.optionsContainer.all.classList.add("select")
        Options.optionsContainer.income.classList.remove("select")
        Options.optionsContainer.expense.classList.remove("select")
    },
    selectIncomes() {
        Options.optionsContainer.income.classList.add("select")
        Options.optionsContainer.all.classList.remove("select")
        Options.optionsContainer.expense.classList.remove("select")
    },
    selectExpenses() {
        Options.optionsContainer.expense.classList.add("select")
        Options.optionsContainer.all.classList.remove("select")
        Options.optionsContainer.income.classList.remove("select")
    }
}

const Table = {
    isChecked: [],
    captureTransactionEvent(event) {
        if(event.target.checked) {
            Table.isChecked.push(event.target.id)
            document.querySelector(`.table-input label.label-${event.target.id}`).classList.add("label-selected")
        } else {
            const index = Table.isChecked.indexOf(event.target.id)
            Table.isChecked.splice(index, 1)
            document.querySelector(`.table-input label.label-${event.target.id}`).classList.remove("label-selected")
        }
    },
    reloadEvents(){
        Table.isChecked = []
    },
    deleteSelectedTransactions() {
        Table.isChecked.forEach(index => Transaction.remove(index))
        Table.reloadEvents()
    }
}

const DOM = {
    transactionsContainer: document.querySelector("#data-table tbody"),
    addTransactions(transaction, index) {
        const tr = document.createElement('tr')
        tr.dataset.index = index
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        DOM.transactionsContainer.appendChild(tr)
    },
    innerHTMLTransaction(transaction, index) {
        const description = transaction.description
        const CSSClass = transaction.amount > 0 ? "income" : "expense"
        const amount = Utils.formatCurrency(transaction.amount)
        const html = `
            <td>
                <div class="table-input">
                    <label for="index_${index}" class="label-index_${index}">Selecionar transação ${transaction.description}</label>
                    <input type="checkbox" id="index_${index}" onchange="Table.captureTransactionEvent(event)" />
                </div>
            </td>
            <td class="description">${transaction.description}</td>
            <td class="${CSSClass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td>
                <img onclick="Modal.open('.modal-overlay-remove'), RemoveForm.setTransaction('${description}',${index})" src="./assets/minus.svg" alt="Remover transação">
            </td>
        `
        return html
    },
    updateBalance() {
        const incomes = Transaction.incomes()
        const expenses = Transaction.expenses()
        const total = Transaction.total()
        if(total<0) {
            document.querySelector(".card.total").classList.add("negative")
        } else {
            document.querySelector(".card.total").classList.remove("negative")
        }
        document.getElementById("incomeBalance").innerHTML = Utils.formatCurrency(incomes)
        document.getElementById("expenseBalance").innerHTML = Utils.formatCurrency(expenses)
        document.getElementById("totalBalance").innerHTML = Utils.formatCurrency(total)
    },
    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    },
    //Opções
    optionAll() {
        DOM.clearTransactions()
        Transaction.all.forEach((transaction, index) => DOM.addTransactions(transaction, index))
        Options.selectAll()
    },
    optionIncome() {
        DOM.clearTransactions()
        Transaction.all.forEach((transaction, index) => {
            if(transaction.amount > 0) {
                DOM.addTransactions(transaction, index)
            }
        })
        Options.selectIncomes()
    },
    optionExpense() {
        DOM.clearTransactions()
        Transaction.all.forEach((transaction, index) => {
            if(transaction.amount < 0) {
                DOM.addTransactions(transaction, index)
            }
        })
        Options.selectExpenses()
    }
}

const Utils = {
    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""
        value = String(value).replace(/\D/g, "")
        value = Number(value)/100
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value
    },
    formatAmount(value) {
        value = Number(value.replace(/\,\./g, "")) * 100
        return value
    },
    formatDate(date) {
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    }
}

const Form = {
    description: document.querySelector("input#description"),
    amount: document.querySelector("input#amount"),
    date: document.querySelector("input#date"),
    getValue() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },
    validateForm() {
        const { description, amount, date} = Form.getValue()
        if(description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos.")
        }
    },
    formatFields() {
        let { description, amount, date} = Form.getValue()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)
        return {
            description,
            amount,
            date
        }
    },
    clearFields() {
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    },
    submit(event) {
        event.preventDefault()
        try {
            Form.validateForm()
            const transaction = Form.formatFields()
            Transaction.add(transaction)
            Form.clearFields()
            Modal.close(".modal-overlay")
        } catch (error) {
            alert(error.message)
        }
    }
}

const RemoveForm = {
    transaction: {
        index: 0,
        validateOneTransaction: false
    },
    setTransaction(description, index) {
        RemoveForm.validateOneTransaction = true
        RemoveForm.transaction.index = index
        document.querySelector("#form-remove h2")
        .innerHTML = `Deseja apagar a transação: ${description}?`
    },
    setMultipleTransactions() {
        document.querySelector("#form-remove h2")
        .innerHTML = "Deseja remover as transações selecionadas?"
    },
    submit(event) {
        event.preventDefault()
        if(RemoveForm.validateOneTransaction) {
            Transaction.remove(RemoveForm.transaction.index)
            RemoveForm.validateOneTransaction = false
        } else {
            Table.deleteSelectedTransactions()
        }
        Modal.close(".modal-overlay-remove")
        Table.reloadEvents()
    }
}

const App = {
    init() {
        Transaction.all.forEach((transaction, index) => DOM.addTransactions(transaction, index))
        DOM.updateBalance()
        Storage.set(Transaction.all)
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

App.init()
