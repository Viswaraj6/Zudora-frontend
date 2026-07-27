const BASE_URL = "https://fark618-backend.onrender.com";

let customers = [];
const customerList = document.getElementById("customerList");
const searchInput = document.getElementById("customerSearch");

loadCustomers();
function renderCustomers(data){

    customerList.innerHTML = "";

    data.forEach(customer=>{

        customerList.innerHTML += `

        <div class="customer-card"
             onclick="selectCustomer(${customer._id})">

            <div class="customer-name">
                ${customer.name}
            </div>

            <div class="customer-mobile">
                ${customer.mobile}
            </div>

        </div>

        `;

    });

}

searchInput.addEventListener("input",()=>{

    const value = searchInput.value.toLowerCase();

    const filtered = customers.filter(c=>

        c.name.toLowerCase().includes(value) ||

        c.mobile.includes(value)

    );

    renderCustomers(filtered);

});

function selectCustomer(id){

    const customer =
        customers.find(c=>c._id===id);

    localStorage.setItem(
        "selectedCustomer",
        JSON.stringify(customer)
    );

    window.location.href = "billing.html";

}
