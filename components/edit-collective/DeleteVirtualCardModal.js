import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import Container from '../Container';
import StyledButton from '../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const deleteVirtualCardMutation = gql`
  mutation DeleteVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    deleteVirtualCard(virtualCard: $virtualCard)
  }
`;

const DeleteVirtualCardModal = ({ virtualCard, onSuccess, onClose, onDeleteRefetchQuery, ...modalProps }) => {
  const { toast } = useToast();

  const refetchOptions = onDeleteRefetchQuery
    ? {
        refetchQueries: [onDeleteRefetchQuery],
        awaitRefetchQueries: true,
      }
    : {};

  const [deleteVirtualCard, { loading: isBusy }] = useMutation(deleteVirtualCardMutation, {
    context: API_V2_CONTEXT,
    ...refetchOptions,
  });

  const formik = useFormik({
    initialValues: {},
    async onSubmit() {
      try {
        await deleteVirtualCard({
          variables: {
            virtualCard: { id: virtualCard.id },
          },
        });
      } catch (e) {
        toast({
          variant: 'error',
          message: (
            <FormattedMessage
              defaultMessage="Error deleting virtual card: {error}"
              id="qYxNsK"
              values={{
                error: e.message,
              }}
            />
          ),
        });
        return;
      }
      onSuccess?.(<FormattedMessage defaultMessage="Card successfully deleted" id="+RvjCt" />);
      handleClose();
    },
  });

  const handleClose = () => {
    onClose?.();
  };

  return (
    <StyledModal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <FormattedMessage defaultMessage="Delete virtual card" id="7nrRJ/" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage
              defaultMessage="You are about to delete the virtual card, are you sure you want to continue ?"
              id="TffQlZ"
            />
          </P>
        </ModalBody>
        <ModalFooter isFullWidth>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              type="submit"
              textTransform="capitalize"
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

DeleteVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  onDeleteRefetchQuery: PropTypes.string,
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
};

/** @component */
export default DeleteVirtualCardModal;
