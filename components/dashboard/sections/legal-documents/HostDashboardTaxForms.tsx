import React from 'react';
import { useQuery } from '@apollo/client';
import { PlusIcon } from 'lucide-react';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { HostTaxFormsQueryVariables, LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';
import { sortSelectOptions } from '../../../../lib/utils';

import { Flex } from '../../../Grid';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { accountFilter } from '../../filters/AccountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { DashboardSectionProps } from '../../types';

import LegalDocumentDrawer from './LegalDocumentDrawer';
import LegalDocumentsTable from './LegalDocumentsTable';

const hostDashboardTaxFormsQuery = gql`
  query HostTaxForms(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $account: [AccountReferenceInput]
    $status: [LegalDocumentRequestStatus]
    $orderBy: ChronologicalOrderInput
    $searchTerm: String
    $requestedAtFrom: DateTime
    $requestedAtTo: DateTime
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      taxForms: hostedLegalDocuments(
        limit: $limit
        offset: $offset
        account: $account
        type: US_TAX_FORM
        status: $status
        orderBy: $orderBy
        searchTerm: $searchTerm
        requestedAtFrom: $requestedAtFrom
        requestedAtTo: $requestedAtTo
      ) {
        totalCount
        nodes {
          id
          year
          type
          status
          service
          requestedAt
          updatedAt
          documentLink
          account {
            id
            name
            slug
            type
            imageUrl(height: 128)
          }
        }
      }
    }
  }
`;

const NB_LEGAL_DOCUMENTS_DISPLAYED = 10;

const requestedAtDateFilter = {
  ...dateFilter,
  toVariables: value => dateToVariables(value, 'requestedAt'),
  filter: {
    ...dateFilter.filter,
    labelMsg: defineMessage({ id: 'LegalDocument.RequestedAt', defaultMessage: 'Requested at' }),
  },
};

const schema = z.object({
  limit: integer.default(NB_LEGAL_DOCUMENTS_DISPLAYED),
  offset: integer.default(0),
  account: accountFilter.schema,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  requestedAt: requestedAtDateFilter.schema,
  status: isMulti(z.nativeEnum(LegalDocumentRequestStatus)).optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostTaxFormsQueryVariables> = {
  account: accountFilter.toVariables,
  orderBy: orderByFilter.toVariables,
  searchTerm: searchFilter.toVariables,
  requestedAt: requestedAtDateFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  account: accountFilter.filter,
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  requestedAt: requestedAtDateFilter.filter,
  status: {
    labelMsg: defineMessage({ id: 'LegalDocument.Status', defaultMessage: 'Status' }),
    valueRenderer: ({ intl, value }) => i18nLegalDocumentStatus(intl, value),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(LegalDocumentRequestStatus)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
  },
};

const IGNORED_QUERY_PARAMS = ['slug', 'section'];

const hasPagination = (data, queryVariables): boolean => {
  const totalCount = data?.host?.taxForms?.totalCount;
  return Boolean(queryVariables.offset || (totalCount && totalCount > NB_LEGAL_DOCUMENTS_DISPLAYED));
};

const HostDashboardTaxForms = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);
  const [focusedLegalDocument, setFocusedLegalDocument] = React.useState(null);

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { hostSlug },
  });

  const { data, previousData, error, variables, loading } = useQuery(hostDashboardTaxFormsQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });

  const canEdit = Boolean(LoggedInUser && !LoggedInUser.isAccountantOnly(data?.host));
  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Tax Forms" id="skSw4d" />}
        actions={
          canEdit && (
            <Button
              data-cy="btn-new-tax-form"
              className="gap-1"
              size="sm"
              disabled
              // disabled={loading || loadingLoggedInUser}
              // onClick={() => {
              //   setFocusedLegalDocument(null);
              //   setDrawerOpen(true);
              // }}
            >
              <span>
                <FormattedMessage id="TaxForm.New" defaultMessage="Add New" />
              </span>
              <PlusIcon size={20} />
            </Button>
          )
        }
      />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : !loading && !data?.host.taxForms?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="TAX_FORM"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <LegalDocumentsTable
            documents={data?.host.taxForms}
            loading={loading}
            nbPlaceholders={NB_LEGAL_DOCUMENTS_DISPLAYED}
            resetFilters={() => queryFilter.resetFilters({})}
            onOpen={document => {
              setDrawerOpen(true);
              setFocusedLegalDocument(document);
            }}
          />

          <Flex my={4} justifyContent="center">
            {hasPagination(data || previousData, variables) && (
              <Pagination
                variant="input"
                offset={variables.offset}
                limit={variables.limit}
                total={(data || previousData)?.host?.taxForms?.totalCount || 0}
                ignoredQueryParams={IGNORED_QUERY_PARAMS}
                isDisabled={loading}
              />
            )}
          </Flex>
          {data?.host && (
            <LegalDocumentDrawer
              open={isDrawerOpen}
              host={data.host}
              document={focusedLegalDocument}
              onClose={() => setDrawerOpen(false)}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default HostDashboardTaxForms;
