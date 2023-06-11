import runNotification from './notification-helper';
import { uploadDocument, updateDocument } from '../network/session-core';

/**
 * @typedef {import('@inrupt/solid-ui-react').SessionContext} Session
 */

/**
 * Function that truncates file names greater than 25 characters and leaves an
 * ellipsis in the middle or returns the original file name if 25 or less characters
 *
 * @function truncateLongFileName
 * @param {string} filename - Name of file
 * @returns {string} filaname - Returns truncated file name for files names longer
 * than 25 characters, otherwise, it'll return the original file name
 */

export const truncateLongFileName = (filename) => {
  if (filename.length > 25) {
    const filenameStart = filename.slice(0, 10);
    const filenameEnd = filename.slice(-10);

    return `${filenameStart}...${filenameEnd}`;
  }

  return filename;
};

/**
 * Makes a default handleFormSubmission function that can be used
 * by form elements in PASS
 *
 * @memberof utils
 * @function makeHandleFormSubmission
 * @param {string} uploadType - Type of upload (cross, self, etc.) to perform
 * @param {object} state - current state
 * @param {object} dispatch - dispatch for actions
 * @param {Session} session - current Solid session
 * @param {Function} clearInputFields - function to call to clear form
 * @returns {Function} A function that components can call to submit forms to PASS
 */
const makeHandleFormSubmission =
  (uploadType, state, dispatch, session, clearInputFields) =>
  async (event, crossPodUsername = '') => {
    event.preventDefault();
    dispatch({ type: 'SET_PROCESSING' });

    if (!state.file) {
      runNotification('Submission failed. Reason: missing file', 5, state, dispatch);
      setTimeout(() => {
        dispatch({ type: 'CLEAR_PROCESSING' });
      }, 3000);
      return;
    }

    const fileObject = {
      type: event.target.document.value,
      date: event.target.date.value,
      description: event.target.description.value,
      file: state.file
    };

    const fileName = truncateLongFileName(fileObject.file.name);

    try {
      runNotification(`Uploading "${fileName}" to Solid...`, 3, state, dispatch);

      await uploadDocument(session, uploadType, fileObject, state.verifyFile, crossPodUsername);

      runNotification(`File "${fileName}" updated on Solid.`, 5, state, dispatch);
      clearInputFields(event);
    } catch (e) {
      try {
        runNotification('Updating contents in Solid Pod...', 3, state, dispatch);

        await updateDocument(session, uploadType, fileObject, crossPodUsername);

        runNotification(`File "${fileName}" updated on Solid.`, 5, state, dispatch);
        clearInputFields(event);
      } catch (error) {
        runNotification(`Operation failed. Reason: ${error.message}`, 5, state, dispatch);
        setTimeout(() => {
          clearInputFields(event);
        }, 3000);
      }
    }
  };

export default makeHandleFormSubmission;
