import React from 'react';
import { useSession } from '@inrupt/solid-ui-react';
import { Login, Logout } from './components/Login';
import {
  UploadDocumentForm,
  FetchDocumentForm,
  DeleteDocumentForm,
  CrossPodQueryForm,
  CrossPodWriteForm,
  SetAclPermissionForm
} from './components/Form';
import Footer from './components/Form/Footer';
import Mockup from './components/Form/Mockup';
import NavBar from './components/Form/NavBar';

const App = () => {
  const { session } = useSession();

  return (
    <>
      <div />
      {!session.info.isLoggedIn ? (
        <>
          {/* <Login /> */}
          <Mockup />
        </>
      ) : (
        <main>
          <NavBar />
          <Logout />
          <UploadDocumentForm />
          <FetchDocumentForm />
          <DeleteDocumentForm />
          <SetAclPermissionForm />
          <CrossPodQueryForm />
          <CrossPodWriteForm />
        </main>
      )}
      {/* <AppFooter /> */}
      <Footer />
    </>
  );
};

export default App;
