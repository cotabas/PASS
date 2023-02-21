import {
  getSourceUrl,
  saveFileInContainer,
  createContainerAt,
  getSolidDataset,
  getThingAll,
  createThing,
  buildThing,
  setThing,
  saveSolidDatasetAt,
  createSolidDataset,
  saveSolidDatasetInContainer,
  deleteContainer,
  deleteFile,
} from "@inrupt/solid-client";
import { SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf";

/**
 * URL to Solid Provider
 * @name SOLID_IDENTITY_PROVIDER
 * @type {string}
 */

export const SOLID_IDENTITY_PROVIDER = "https://opencommons.net";

/**
 * @typedef fileObject
 * @property {string} type - Type of document
 * @property {string} date - Date of upload
 * @property {string} description - Description of document
 * @property {Object} file - An object which contain infomation about the file being uploaded as well the document itself
 */

/**
 * Function that uploads file to Pod on Solid
 * @memberof utils
 * @function uploadDocument
 * @param {fileObject} fileObject - Object containing information about file from form submission
 * @param {Session} session - Solid Session
 * @returns {void} Void - File upload is handled via Solid libraries
 */

// Main function to upload document to user's Pod on Solid
export const uploadDocument = async (fileObject, session) => {
  if (!fileObject.file) {
    throw "File missing from submission!";
  }

  const POD_URL = String(session.info.webId.split("profile")[0]);

  // Generating Directory for document
  const documentFolder = POD_URL + fileObject.type;
  await createContainerAt(documentFolder, { fetch: session.fetch }).then(
    (response) => {
      console.log(`Dataset Information`, response);
    }
  );

  // Storing File in Document
  const storedFile = await placeFileInContainer(
    fileObject,
    `${documentFolder}`,
    session
  );

  // Setting url to location of document directory
  const solidDatasetUrl = documentFolder;
  let getDatasetFromUrl = await getSolidDataset(solidDatasetUrl, {
    fetch: session.fetch,
  });

  console.log(getDatasetFromUrl);

  const ttlFile = hasTTLFiles(getDatasetFromUrl);

  const toBeUpdated = buildThing(createThing({ name: storedFile }))
    .addStringNoLocale(SCHEMA_INRUPT.name, fileObject.file.name)
    .addStringNoLocale(SCHEMA_INRUPT.identifier, fileObject.type)
    .addStringNoLocale(SCHEMA_INRUPT.endDate, fileObject.date)
    .addStringNoLocale(SCHEMA_INRUPT.description, fileObject.description)
    .build();

  console.log("TTL url", ttlFile);

  let myDataset;
  if (ttlFile !== null) {
    myDataset = await getSolidDataset(ttlFile, { fetch: session.fetch });
    console.log("Call original dataset: ", myDataset);

    myDataset = setThing(myDataset, toBeUpdated);

    await saveSolidDatasetAt(ttlFile, solidDatasetUrl, myDataset, {
      fetch: session.fetch,
    }).then((result) => {
      console.log("New dataset: ", result);
    });
  } else {
    let courseSolidDataset = createSolidDataset();

    courseSolidDataset = setThing(courseSolidDataset, toBeUpdated);

    await saveSolidDatasetInContainer(solidDatasetUrl, courseSolidDataset, {
      fetch: session.fetch,
    }).then((result) => {
      console.log("newly generated and uploaded dataset: ", result);
    });
  }

  console.log(
    `Uploaded ${fileObject.file.name} to pod successfully and set identifier to ${fileObject.type},
    end date to ${fileObject.date}, and description to ${fileObject.description}`
  );
};

/**
 * Function that checks if location has TTL files
 * @memberof utils
 * @function hasTTLFiles
 * @param {string} url - URL of location in question
 * @returns {Object|null} ttlFiles or null - An object of first ttl file in location or null, if file does not exist
 */

const hasTTLFiles = (url) => {
  const items = getThingAll(url);
  if (!items) {
    return null;
  }

  const ttlFiles = items.find((item) => item.url.slice(-3) === "ttl");
  if (ttlFiles) {
    return ttlFiles;
  } else {
    return null;
  }
};

/**
 * Function checks if location has any files
 * @memberof utils
 * @function hasFiles
 * @param {string} url - URL of location in question
 * @returns {Array|null} [directory, files] or null - an Array of Objects consisting of the directory container and the rest of the files or null
 */

// Sub-routine to check for any existing files in directory to help in container deletion from Pod
const hasFiles = (url) => {
  const items = getThingAll(url);
  if (!items) {
    return null;
  } else {
    let directory = "";
    let files = [];

    items.filter((file) => {
      if (!file.url.slice(-3).includes("/")) {
        files.push(file);
      } else {
        directory = file;
      }
    });
    return [directory, files];
  }
};

/**
 * Function helps put file into Pod container
 * @memberof utils
 * @function placeFileInContainer
 * @param {Object} fileObject - Object of file being uploaded to Solid
 * @param {string} targetContainerUrl - URL location of Pod container
 * @param {string} session - Solid Session
 * @returns {void} Void - A message regarding the status of upload to user's Pod
 */

const placeFileInContainer = async (
  fileObject,
  targetContainerUrl,
  session
) => {
  try {
    const savedFile = await saveFileInContainer(
      targetContainerUrl,
      fileObject.file,
      {
        slug: fileObject.file.name,
        contentType: fileObject.type,
        fetch: session.fetch,
      }
    );
    console.log(`File saved at ${getSourceUrl(savedFile)}`);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Function that fetch information of file from Pod on Solid, if exist
 * @memberof utils
 * @function fetchDocuments
 * @param {Session} session - Solid Session
 * @param {string} fileType - Type of document
 * @returns {void} Void - Either a string containing the url location of the document, if exist, or throws an Error
 */

export const fetchDocuments = async (session, fileType) => {
  const documentUrl = fetchUrl(session, fileType);

  try {
    await getSolidDataset(documentUrl, {
      fetch: session.fetch,
    });
    return documentUrl;
  } catch (error) {
    console.log("No Data Found");
    throw "No Data Found";
  }
};

/**
 * Function that delete file from Pod on Solid, if exist
 * @memberof utils
 * @function deleteDocuments
 * @param {Session} session - Solid Session
 * @param {string} fileType - Type of document
 * @returns {string} directory.url - the URL of document container and the response on whether document file is deleted, if exist, or not, if it doesn't
 */

export const deleteDocumentFile = async (session, fileType) => {
  const documentUrl = fetchUrl(session, fileType);
  let fetched = await getSolidDataset(documentUrl, {
    fetch: session.fetch,
  });

  // Solid requires all files within Pod Container must be deleted before
  // the container itself can be delete itself
  const [directory, files] = hasFiles(fetched);
  files.filter(async (file) => {
    if (!file.url.slice(-3).includes("/")) {
      await deleteFile(file.url, { fetch: session.fetch });
    }
  });

  return directory.url;
};

/**
 * Function that delete file from Pod on Solid, if exist
 * @memberof utils
 * @function deleteDocumentContainer
 * @param {Session} session - Solid Session
 * @param {string} documentUrl - Url of document url container
 * @returns {void} Void - Perform action that deletes container completely from Pod
 */

export const deleteDocumentContainer = async (session, documentUrl) => {
  await deleteContainer(documentUrl, { fetch: session.fetch });
};

/**
 * Function that returns location of file container, if exist
 * @memberof utils
 * @function fetchUrl
 * @param {Session} session - Solid Session
 * @param {string} fileType - Type of document
 * @returns {string|null} url or null - A url location of where the file is located in or null, if doesn't exist
 */

const fetchUrl = (session, fileType) => {
  const POD_URL = String(session.info.webId.split("profile")[0]);

  switch (fileType) {
    case "Bank Statement":
      return `${POD_URL}Bank%20Statement/`;
    case "Passport":
      return `${POD_URL}Passport/`;
    case "Drivers License":
      return `${POD_URL}Drivers%20License/`;
    default:
      return null;
  }
};
