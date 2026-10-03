const DB_NAME = "ProductSalesDB";
const DB_VERSION = 1;
const STORE_NAME = "products";

let db;


/* =========================
   IndexedDB
========================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store =
                    database.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );

                store.createIndex(
                    "name",
                    "name",
                    {
                        unique: false
                    }
                );
            }
        };

        request.onsuccess = function(event) {

            db = event.target.result;

            resolve(db);
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   商品取得
========================= */

function getProducts() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();

        request.onsuccess = function() {

            resolve(request.result);
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   商品取得
========================= */

function getProduct(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.get(id);

        request.onsuccess = function() {

            resolve(request.result);
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   商品追加
========================= */

function addProductToDB(
    name,
    price
) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const product = {

            name: name,

            price: price,

            salesCount: 0

        };

        const request =
            store.add(product);

        request.onsuccess = function(event) {

            product.id =
                event.target.result;

            resolve(product);
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   商品更新
========================= */

function updateProduct(product) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.put(product);

        request.onsuccess = function() {

            resolve(product);
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   商品削除
========================= */

function deleteProductFromDB(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.delete(id);

        request.onsuccess = function() {

            resolve();
        };

        request.onerror = function(event) {

            reject(event.target.error);
        };

    });
}


/* =========================
   売上計算
========================= */

function calculateProductSales(product) {

    return product.price *
           product.salesCount;
}


function calculateTotalSales(products) {

    return products.reduce(
        (total, product) => {

            return total +
                calculateProductSales(product);

        },
        0
    );
}


/* =========================
   表示
========================= */

async function loadProducts() {

    const products =
        await getProducts();

    const productList =
        document.getElementById(
            "productList"
        );

    productList.innerHTML = "";

    products.forEach(product => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "product";

        const productSales =
            calculateProductSales(
                product
            );

        div.innerHTML = `

            <div class="product-name">
                ${escapeHtml(product.name)}
            </div>

            <div class="price">
                単価：
                ${product.price.toLocaleString()}
                円
            </div>

            <div class="sales-count">
                販売数：
                ${product.salesCount}
            </div>

            <div class="product-sales">
                商品売上：
                ${productSales.toLocaleString()}
                円
            </div>

            <div class="sales-buttons">

                <button
                    class="minus"
                    data-action="minus">
                    −
                </button>

                <button
                    class="plus"
                    data-action="plus">
                    ＋
                </button>

            </div>

            <div class="management-buttons">

                <button
                    data-action="rename">
                    商品名変更
                </button>

                <button
                    data-action="price">
                    単価変更
                </button>

                <button
                    class="delete-button"
                    data-action="delete">
                    商品削除
                </button>

            </div>

        `;


        /* ＋ */

        div.querySelector(
            '[data-action="plus"]'
        ).addEventListener(
            "click",
            async function() {

                product.salesCount++;

                await updateProduct(
                    product
                );

                await loadProducts();

            }
        );


        /* − */

        div.querySelector(
            '[data-action="minus"]'
        ).addEventListener(
            "click",
            async function() {

                if (product.salesCount <= 0) {

                    return;
                }

                product.salesCount--;

                await updateProduct(
                    product
                );

                await loadProducts();

            }
        );


        /* 商品名変更 */

        div.querySelector(
            '[data-action="rename"]'
        ).addEventListener(
            "click",
            async function() {

                const newName =
                    prompt(
                        "新しい商品名を入力してください",
                        product.name
                    );

                if (
                    newName === null ||
                    newName.trim() === ""
                ) {

                    return;
                }

                product.name =
                    newName.trim();

                await updateProduct(
                    product
                );

                await loadProducts();

            }
        );


        /* 単価変更 */

        div.querySelector(
            '[data-action="price"]'
        ).addEventListener(
            "click",
            async function() {

                const newPrice =
                    prompt(
                        "新しい単価を入力してください",
                        product.price
                    );

                if (newPrice === null) {

                    return;
                }

                const price =
                    Number(newPrice);

                if (
                    !Number.isInteger(price) ||
                    price < 0
                ) {

                    alert(
                        "0以上の整数を入力してください。"
                    );

                    return;
                }

                product.price =
                    price;

                await updateProduct(
                    product
                );

                await loadProducts();

            }
        );


        /* 削除 */

        div.querySelector(
            '[data-action="delete"]'
        ).addEventListener(
            "click",
            async function() {

                const result =
                    confirm(
                        `「${product.name}」を削除しますか？`
                    );

                if (!result) {

                    return;
                }

                await deleteProductFromDB(
                    product.id
                );

                await loadProducts();

            }
        );


        productList.appendChild(div);

    });


    const totalSales =
        calculateTotalSales(
            products
        );

    document.getElementById(
        "totalSales"
    ).textContent =
        totalSales.toLocaleString();

}


/* =========================
   商品追加
========================= */

async function handleAddProduct() {

    const nameInput =
        document.getElementById(
            "productName"
        );

    const priceInput =
        document.getElementById(
            "productPrice"
        );

    const name =
        nameInput.value.trim();

    const price =
        Number(priceInput.value);


    if (name === "") {

        alert(
            "商品名を入力してください。"
        );

        return;
    }


    if (
        !Number.isInteger(price) ||
        price < 0
    ) {

        alert(
            "0以上の整数を入力してください。"
        );

        return;
    }


    await addProductToDB(
        name,
        price
    );


    nameInput.value = "";

    priceInput.value = "";


    await loadProducts();

}


/* =========================
   XSS対策
========================= */

function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   PWA
========================= */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register(
                    "./sw.js"
                )
                .catch(
                    console.error
                );

        }
    );

}


/* =========================
   起動
========================= */

async function startApp() {

    try {

        await openDatabase();

        document
            .getElementById(
                "addProductButton"
            )
            .addEventListener(
                "click",
                handleAddProduct
            );

        await loadProducts();

    } catch (error) {

        console.error(error);

        alert(
            "データベースを開けませんでした。"
        );

    }

}


startApp();