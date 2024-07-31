// Package Imports
import express, { type Request, type Response } from "express";
import { readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import multer from 'multer';

// Package Prep
const upload = multer({ dest: './src/content' });
const app = express();

// Constants
const port = 3000
const content_dir = join(__dirname, "content");
const main = readFileSync(join(__dirname, "common", "a.html"));

// Express Prep
app.use(express.static(join(__dirname, "common")))
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// HTML Strings
const help = `<body class="roboto-light dark center"><h1 class="m-0">Start by entering a unique string into the url bar,</h1><h1 class="m-0">you can check if its available by going to the url!</></body>`;
const nothing_found = (route: string) => `<body class="roboto-light dark center"><h1>Nothing was found, feel free to upload something!</h1><form action="upload" method="post" enctype="multipart/form-data"><input type="file" name="upload"><button type="submit" name="route" value="${route}">Upload</button></form></body>`;

// Express Functions
app.get('/', (req, res) => {
  res.send(main + help);
})

app.post('/upload', upload.single('upload'), (req, res) => {
  const original_name = req.file?.originalname;
  const route = req.body.route;
  const raw_name = req.file?.filename
  const content = readdirSync(content_dir);
  if (!content || raw_name == undefined || !content.includes(raw_name)) {
    return res.sendStatus(500);
  }
  const file = renameSync(content_dir + "\\" + raw_name, content_dir + "\\" + route + "." + original_name?.split(".").pop());
  res.redirect(route);
})


/**
 * Returns the first instance of a file in a directory
 * @param dir the path of the directory to search
 * @param fileName the filename to search for
 * @returns the found file name with its filetype (.mp4, .png, etc.)
 */
function findByName(dir: string, fileName: string): string | null {
  const directory = readdirSync(dir);
  for (const file of directory) {
    if (file.startsWith(fileName))
      return file;
  }
  return null;
}

app.use((req, res, next) => {

  const content = readdirSync(content_dir);
  const required = req.path.split("/")[1];

  if (req.path.endsWith("/remove")) {
    if (!content || required == undefined)
      return res.redirect("/" + required);
    const file = findByName(content_dir, required);
    if (file == null)
      return res.redirect("/" + required);
    rmSync(content_dir + "\\" + file);
    res.redirect("/")
    return 
  }

  if (!content || required == undefined)
    return res.send(main + nothing_found(req.url));
  const file = findByName(content_dir, required);
  if (file == null)
    return res.send(main + nothing_found(req.url));
  res.sendFile(content_dir + "\\" + file);
});

app.listen(port, () => {
  console.log(`Application listening on port ${port}`);
});