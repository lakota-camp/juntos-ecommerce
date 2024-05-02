import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import open from 'open';
import path from 'path';

const app = express(); // Creates an express application
const PORT = process.env.PORT || 3000; // Dynamically sets port number for Heroku

app.set('view engine', 'ejs'); // Sets the view engine to ejs
app.use(bodyParser.urlencoded({ extended: true })); // Parses the body of the request

// Compute the directory path for 'templates' directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.set('views', path.join(__dirname, 'templates')); // Set the views directory to 'templates'

const displayMapping = {
    products: "Products",
    categories: "Categories",
    clothing: "Clothing",
    accessories: "Accessories",
    customerAccount: "Customer Account",
    vendors: "Vendors",
    reviews: "Product Reviews",
    priceUnder50: "Products Under $50",
    quantityOver50: "Quantity Over 50",
    customerAccountReference: "Customer Account References",
    vendorInventoryInfo: "Vendor Inventory",
    productCategoryClothing: "Clothing Products",
    productCategoryAccessories: "Accessories Products",
    minMaxAssetValueClothingAccessories: "Min/Max Asset Value for Clothing and Accessories",
    numberItemsInCart: "Number of Items in Customer Carts",
    orderTotalCategories: "Order Total Categories",
    productsGreaterAvgPrice: "Product prices greater than average",
    productsLessAvgPrice: "Product prices less than average",
    accessoriesCount: "Total Accessories",
    clothingCount: "Total Clothing"
};


app.get('/', (req, res) => {
    res.render('index');
});

app.post('/results', (req, res) => {
    const selection = req.body.selection;

    let query = '';

    switch (selection) {
        case 'products':
            query = 'SELECT * FROM Products;';
            break;
        case 'categories':
            query = 'SELECT * FROM Categories;';
            break;
        case 'clothing':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        Products.ProductDescription,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Clothing.Gender AS ClothingGender,
                        Clothing.Size AS ClothingSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Clothing ON Clothing.CategoryID = Categories.CategoryID;`;
            break;
            case 'clothingCount':
                query = `SELECT 
                    COUNT(*) AS TotalClothing
                    FROM Clothing;`
                break;
        case 'accessories':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        Products.ProductDescription,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID;`
            break;
        case 'accessoriesCount':
            query = `SELECT 
                COUNT(*) AS TotalAccessories 
                FROM Accessories;`
            break;
        case 'customerAccount':
            query = 'SELECT * FROM CustomerAccount;';
            break;  
        case 'vendors':
            query = 'SELECT * FROM Vendors;';
            break;
        case 'reviews':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName, 
                        CustomerAccount.CustomerID, 
                        CustomerAccount.FirstName, 
                        CustomerAccount.LastName, Reviews.RatingDate, 
                        Reviews.Rating, Reviews.Comment 
                    FROM Reviews
                    JOIN Products ON Reviews.ProductID = Products.ProductID
                    JOIN CustomerAccount ON  CustomerAccount.CustomerID = Reviews.CustomerID
                    ORDER BY Reviews.Rating;`;
            break;
        case 'priceUnder50':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName,
                        Products.ProductDescription,
                        Products.ProductPrice,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                    WHERE ProductPrice < 50
                    ORDER BY Products.ProductPrice;`;
            break;
        case 'quantityOver50':
            query = `SELECT 
                        Products.ProductID, 
                        Products.ProductName,
                        Products.ProductDescription,
                        Products.ProductPrice,
                        Products.StockQuantity,
                        Categories.CategoryID,
                        Categories.CategoryName,
                        Categories.CategoryDescription,
                        Accessories.AccessoriesType,
                        Accessories.Gender AS AccessoriesGender,
                        Accessories.Size AS AccessoriesSize
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.ProductID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                    WHERE StockQuantity > 50
                    ORDER BY StockQuantity;`;
            
            break;
        case 'customerAccountReference':
            query = `SELECT 
                        c.CustomerID as CustomerID, 
                        c.FirstName as CustomerFirstName, 
                        c.LastName as CustomerLastName, 
                        f.CustomerID as ReferenceID, 
                        f.FirstName as CustomerReferenceFirstName, 
                        f.LastName as CustomerReferenceLastName 
                    FROM CustomerAccount c
                    JOIN CustomerAccount f ON c.ReferredByCustomerID = f.CustomerID;`;
            break;
        case 'vendorInventoryInfo':
            query = `SELECT
                       Vendors.Name AS VendorName,
                       SUM(Products.StockQuantity) AS TotalInventoryStock,
                       SUM(Products.ProductPrice) AS DollarAmountItems,
                       (SUM(Products.StockQuantity) * SUM(Products.ProductPrice)) AS TotalDollarInInventory
                    FROM Products
                    JOIN Vendors ON Products.VendorID = Vendors.VendorID
                    GROUP BY VendorName
                    ORDER BY TotalDollarInInventory;`;
            break;
        case 'productCategoryClothing':
            query = `SELECT
                      Products.ProductID, Products.ProductName, Products.ProductPrice, Products.StockQuantity,
                      Categories.CategoryID, Categories.CategoryName,
                      Clothing.ClothingType, Clothing.Gender, Clothing.Size
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.CategoryID
                    JOIN Clothing ON Categories.CategoryID = Clothing.CategoryID;`;
            break;
        case 'productCategoryAccessories':
            query = `SELECT
                      Products.ProductID, Products.ProductName, Products.ProductPrice, Products.StockQuantity,
                      Categories.CategoryID, Categories.CategoryName,
                      Accessories.AccessoriesType, Accessories.Gender, Accessories.Size
                    FROM Products
                    JOIN Categories ON Products.ProductID = Categories.CategoryID
                    JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID;`;
            break;
        case 'minMaxAssetValueClothingAccessories':
            query = `SELECT
                        Products.ProductName,
                        Categories.CategoryName,   
                        MAX(StockQuantity * ProductPrice) AS AssetValueInStock
                        FROM Products
                        JOIN Categories ON Products.ProductID = Categories.ProductID
                        JOIN Clothing ON Categories.CategoryID = Clothing.CategoryID
                        
                        UNION
                        
                        SELECT
                        Products.ProductName,
                        Categories.CategoryName, 
                        MIN(StockQuantity * ProductPrice) AS AssetValueInStock
                        FROM Products
                        JOIN Categories ON Products.ProductID = Categories.ProductID
                        JOIN Clothing ON Categories.CategoryID = Clothing.CategoryID
                        
                        UNION
                        
                        SELECT
                        Products.ProductName,
                        Categories.CategoryName, 
                        MAX(StockQuantity * ProductPrice) AS AssetValueInStock
                        FROM Products
                        JOIN Categories ON Products.ProductID = Categories.ProductID
                        JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                        
                        UNION
                        
                        SELECT
                        Products.ProductName,
                        Categories.CategoryName, 
                        MIN(StockQuantity * ProductPrice) AS AssetValueInStock
                        FROM Products
                        JOIN Categories ON Products.ProductID = Categories.ProductID
                        JOIN Accessories ON Categories.CategoryID = Accessories.CategoryID
                        ORDER BY AssetValueInStock;`;
                break;
            case 'numberItemsInCart':
                query = `SELECT 
                          CustomerAccount.CustomerID, CustomerAccount.FirstName, CustomerAccount.LastName,
                          ShoppingCart.CartID,
                          COUNT(CartItem.CartIemID) AS ItemsInCart
                    FROM ShoppingCart
                    LEFT JOIN CartItem ON ShoppingCart.CartID = CartItem.CartID
                    LEFT JOIN CustomerAccount ON ShoppingCart.CustomerID = CustomerAccount.CustomerID
                    GROUP BY ShoppingCart.CartID;`;
                break;
            case 'orderTotalCategories':
                query = `SELECT
                            CustomerAccount.CustomerID, CustomerAccount.FirstName, CustomerAccount.LastName,
                            Orders.OrderID, Orders.OrderDate, Orders.ShippingCity, Orders.ShippingState,
                            (OrderItems.Quantity * Products.ProductPrice) AS OrderTotal,
                            CASE
                                WHEN (OrderItems.Quantity * Products.ProductPrice) < 50 THEN 'Small Order: OrderTotal < $50'
                                WHEN ((OrderItems.Quantity * Products.ProductPrice) >= 50) AND (OrderItems.Quantity * Products.ProductPrice) < 100 THEN 'Medium Order: OrderTotal >= $50'
                                WHEN (OrderItems.Quantity * Products.ProductPrice) >= 100 THEN 'Large Order: OrderTotal > $100'
                                ELSE 'Invalid OrderTotal'
                            END AS OrderTotalCategory
                        FROM Orders
                        JOIN CustomerAccount ON Orders.CustomerID = CustomerAccount.CustomerID
                        JOIN OrderItems ON Orders.OrderID = OrderItems.OrderID
                        JOIN Products ON OrderItems.ProductID = Products.ProductID
                        GROUP BY Orders.OrderID
                        ORDER BY OrderTotalCategory DESC;`
                break;
            case 'productsGreaterAvgPrice':
                query = `SELECT
                            ProductName, ProductPrice
                        FROM Products
                        WHERE ProductPrice > (SELECT AVG(ProductPrice) FROM Products);`
                break;
            case 'productsLessAvgPrice':
                query = `SELECT
                            ProductName, ProductPrice
                        FROM Products
                        WHERE ProductPrice < (SELECT AVG(ProductPrice) FROM Products);`
                break;
        default:
            return res.send('Invalid selection');
    }
    const db = new sqlite3.Database('./TeamFour.db', sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
            return res.send('Error opening database');
        }
    });

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error executing query", err.message);
            return res.send("Error executing query");
        }
        db.close(() => {
            res.render('results', { selectedTable: displayMapping[selection] || selection, results: rows });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        open(`http://localhost:${PORT}`);
    }
});