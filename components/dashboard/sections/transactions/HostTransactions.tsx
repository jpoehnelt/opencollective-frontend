import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FlaskConical, Megaphone } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { TransactionsTableQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { FEEDBACK_KEY, FeedbackModal } from '../../../FeedbackModal';
import { Flex } from '../../../Grid';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/Popover';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { DashboardSectionProps } from '../../types';

import {
  FilterMeta as CommonFilterMeta,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from './filters';
import { transactionsTableQuery } from './queries';
import TransactionsTable from './TransactionsTable';

export const schema = commonSchema.extend({
  account: hostedAccountFilter.schema,
  excludeAccount: z.string().optional(),
  accountingCategory: accountingCategoryFilter.schema,
});

export type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
};

// Only needed when values and key of filters are different
// to expected key and value of QueryVariables
export const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: hostedAccountFilter.toVariables,
  excludeAccount: value => ({ excludeAccount: { slug: value } }),
};

// The filters config is used to populate the Filters component.
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  account: hostedAccountFilter.filter,
  excludeAccount: {
    ...hostedAccountFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Exclude account', id: 'NBPN5y' }),
  },
  accountingCategory: accountingCategoryFilter.filter,
};

const hostTransactionsMetaDataQuery = gql`
  query HostTransactionsMetaData($slug: String!) {
    transactions(host: { slug: $slug }, limit: 0) {
      paymentMethodTypes
      kinds
    }
    host(slug: $slug) {
      id
      name
      legacyId
      slug
      currency
      settings
      accountingCategories {
        nodes {
          id
          code
          name
          kind
        }
      }
    }
  }
`;

enum TestLayout {
  DEBITCREDIT = 'debitcredit',
  AMOUNT = 'amount',
}

const HostTransactions = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);

  const [layout, setLayout] = React.useState(TestLayout.AMOUNT);

  const { data: metaData } = useQuery(hostTransactionsMetaDataQuery, {
    variables: { slug: hostSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });

  const views = [
    {
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      id: 'all',
    },
    {
      label: intl.formatMessage({ id: 'HostedCollectives', defaultMessage: 'Hosted Collectives' }),
      filter: { excludeAccount: hostSlug },
      id: 'hosted_collectives',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Fiscal Host', id: 'Fiscalhost' }),
      filter: { account: hostSlug },
      id: 'fiscal_host',
    },
  ];
  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    meta: {
      currency: metaData?.host?.currency,
      kinds: metaData?.transactions?.kinds,
      hostSlug: hostSlug,
      paymentMethodTypes: metaData?.transactions?.paymentMethodTypes,
    },
    views,
  });

  const { data, previousData, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });
  const { transactions } = data || {};

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
        actions={
          <div className="flex items-center gap-2">
            <ExportTransactionsCSVModal
              open={displayExportCSVModal}
              setOpen={setDisplayExportCSVModal}
              queryFilter={queryFilter}
              account={metaData?.host}
              isHostReport
              trigger={
                <Button size="sm" variant="outline" onClick={() => setDisplayExportCSVModal(true)}>
                  <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                </Button>
              }
            />
            <PreviewFeatureConfigButton layout={layout} setLayout={setLayout} />
          </div>
        }
      />

      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !transactions?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="TRANSACTIONS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            nbPlaceholders={20}
            queryFilter={queryFilter}
            useAltTestLayout={layout === TestLayout.DEBITCREDIT}
            refetchList={refetch}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route={`/dashboard/${hostSlug}/host-transactions`}
              total={(data || previousData)?.transactions?.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.offset}
              ignoredQueryParams={['collectiveSlug']}
            />
          </Flex>
        </React.Fragment>
      )}
    </div>
  );
};

// To be removed when feature is no longer in preview
const PreviewFeatureConfigButton = ({ layout, setLayout }) => {
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false);

  React.useEffect(() => {
    const localStorageLayout = localStorage.getItem('host-transactions-layout');
    if (localStorageLayout) {
      setLayout(localStorageLayout as TestLayout);
    }
  }, []);
  React.useEffect(() => {
    localStorage.setItem('host-transactions-layout', layout);
  }, [layout]);

  return (
    <React.Fragment>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button size="icon-sm" variant="outline">
                <FlaskConical size={18} />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom">Configure preview feature</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" sideOffset={8}>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Configure layout</h4>
              <p className="text-sm text-muted-foreground">
                {"We're testing layout options, please let us know what you prefer!"}
              </p>
            </div>

            <RadioGroup defaultValue={layout} onValueChange={(value: TestLayout) => setLayout(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TestLayout.DEBITCREDIT} id={TestLayout.DEBITCREDIT} />
                <Label htmlFor={TestLayout.DEBITCREDIT}>Debit/credit columns</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TestLayout.AMOUNT} id={TestLayout.AMOUNT} />
                <Label htmlFor={TestLayout.AMOUNT}>Amount column</Label>
              </div>
            </RadioGroup>
            <Button variant="outline" className="gap-2" onClick={() => setFeedbackModalOpen(true)}>
              <Megaphone size={16} /> Give feedback
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <FeedbackModal
        feedbackKey={FEEDBACK_KEY.HOST_TRANSACTIONS}
        open={feedbackModalOpen}
        setOpen={setFeedbackModalOpen}
      />
    </React.Fragment>
  );
};

export default HostTransactions;
