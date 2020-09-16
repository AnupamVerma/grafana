// Libraries
import React, { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

// Components
import {
  Field,
  Form,
  HorizontalGroup,
  Icon,
  InlineFormLabel,
  Input,
  InputControl,
  LegacyForms,
  Select,
  Tooltip,
} from '@grafana/ui';
import { dateMath, dateTime, QueryEditorProps, SelectableValue } from '@grafana/data';

// Types
import { TestDataDataSource } from './datasource';
import { TestDataQuery, Scenario } from './types';

const showLabelsFor = ['random_walk', 'predictable_pulse', 'predictable_csv_wave'];

type Props = QueryEditorProps<TestDataDataSource, TestDataQuery>;

export const QueryEditor = ({ query, datasource, onChange }: Props) => {
  const { loading, error, value: scenarioList } = useAsync<Scenario[]>(async () => {
    return datasource.getScenarios();
  }, []);

  const currentScenario = useMemo(
    () => scenarioList?.find(scenario => scenario.id === (query.scenarioId || 'random_walk')),
    [scenarioList, query]
  );

  query.stringInput = (query.stringInput || currentScenario?.stringInput) ?? '';
  const onScenarioChange = (item: SelectableValue<string>) => {
    onChange({
      ...query,
      stringInput: currentScenario?.stringInput ?? '',
      scenarioId: item.value!,
    });
  };

  const onInputChange = (e: any) => {
    const { name, value } = e.target;
    onChange({ ...query, [name]: value });
  };

  const options = useMemo(() => (scenarioList || []).map(item => ({ label: item.name, value: item.id })), [
    scenarioList,
  ]);
  const showLabels = useMemo(() => showLabelsFor.includes(query.scenarioId), [query]);

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form">
          <InlineFormLabel className="query-keyword" width={7}>
            Scenario
          </InlineFormLabel>
          <Select
            options={options}
            value={options.find(item => item.value === query.scenarioId)}
            onChange={onScenarioChange}
            width={32}
          />
        </div>
        {currentScenario?.stringInput && (
          <div className="gf-form">
            <InlineFormLabel htmlFor="stringInput" className="query-keyword" width={7}>
              String Input
            </InlineFormLabel>
            <Input
              id="stringInput"
              name="stringInput"
              placeholder={query.stringInput}
              value={query.stringInput}
              onChange={onInputChange}
            />
          </div>
        )}
        <div className="gf-form">
          <InlineFormLabel htmlFor="alias" className="query-keyword" width={7}>
            Alias
          </InlineFormLabel>
          <Input
            id="alias"
            type="text"
            placeholder="optional"
            pattern='[^<>&\\"]+'
            name="alias"
            value={query.alias}
            onChange={onInputChange}
          />
        </div>
        <div className="gf-form gf-form--grow">
          {showLabels ? (
            <>
              <InlineFormLabel htmlFor="labels" className="query-keyword" width={7}>
                Labels
                <Tooltip
                  placement="top"
                  content={
                    <>
                      Set labels using a key=value syntax:
                      <br />
                      {`{ key = "value", key2 = "value" }`}
                      <br />
                      key="value", key2="value"
                      <br />
                      key=value, key2=value
                      <br />
                    </>
                  }
                  theme={'info'}
                >
                  <div className="gf-form-help-icon gf-form-help-icon--right-normal">
                    <Icon name="info-circle" size="sm" />
                  </div>
                </Tooltip>
              </InlineFormLabel>
              <Input
                id="labels"
                name="labels"
                onChange={onInputChange}
                value={query?.labels}
                placeholder="key=value, key2=value2"
              />
            </>
          ) : (
            <div className="gf-form-label gf-form-label--grow" />
          )}
        </div>
      </div>

      {currentScenario.id === 'manual_entry' && <ManualEntryEditor onChange={onChange} query={query} />}
    </>
  );
};

const ManualEntryEditor = ({ onChange, query }) => {
  const addPoint = point => {
    let points = query.points || [];
    const newPointTime = dateMath.parse(point.newPointTime);
    points = [...points, [point.newPointValue, newPointTime.valueOf()]].sort((a, b) => a[1] - b[1]);
    console.log('p', point, points);
  };

  const deletePoint = () => {};

  const points = (query.points || []).map((point, index) => {
    return {
      text: dateTime(point[1]).format('MMMM Do YYYY, H:mm:ss') + ' : ' + point[0],
      value: index,
    };
  });

  console.log('dd', dateMath.parse(dateTime()));

  return (
    <Form onSubmit={addPoint} maxWidth="auto">
      {({ register, control, watch }) => {
        const selectedPoint = watch('selectedPoint');
        return (
          <div style={{ display: 'flex' }}>
            <div className="gf-form">
              <InlineFormLabel htmlFor="newPointValue" className="query-keyword" width={7}>
                New value
              </InlineFormLabel>
              <Input type="number" placeholder="value" id="newPointValue" name="newPointValue" ref={register} />
              <InlineFormLabel htmlFor="newPointTime" className="query-keyword">
                Time
              </InlineFormLabel>
              <Input
                id="newPointTime"
                placeholder="time"
                name="newPointTime"
                ref={register}
                defaultValue={dateTime().format()}
              />
              <button className="btn btn-secondary gf-form-btn">Add</button>
              <InlineFormLabel className="query-keyword">All values</InlineFormLabel>
              <InputControl
                control={control}
                as={Select}
                options={points}
                width={16}
                name="selectedPoint"
                onChange={value => {
                  console.log('v', value);
                  return value;
                }}
              />
            </div>

            {selectedPoint?.value && (
              <div className="gf-form gf-form">
                <button type="button" className="btn btn-danger gf-form-btn" onClick={deletePoint}>
                  Delete
                </button>
              </div>
            )}
            <div className="gf-form gf-form--grow" style={{ flex: 1 }}>
              <div className="gf-form-label gf-form-label--grow" />
            </div>
          </div>
        );
      }}
    </Form>
  );
};
