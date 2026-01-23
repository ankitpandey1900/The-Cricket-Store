from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Serve static files (CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates folder
templates = Jinja2Templates(directory="templates")

# In-memory cart (temporary)
cart = []


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )


@app.post("/add-to-cart")
async def add_to_cart(
    name: str = Form(...),
    price: int = Form(...)
):
    cart.append({
        "name": name,
        "price": price
    })
    return RedirectResponse(url="/", status_code=303)


@app.get("/cart")
async def view_cart():
    return {"cart": cart}
