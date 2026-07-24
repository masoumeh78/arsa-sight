import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import DashboardHeader from './components/DashboardHeader.jsx';
import SearchBar from './components/SearchBar.jsx';
import ChartPanel from './components/ChartPanel.jsx';
import CryptoTable from './components/CryptoTable.jsx';

export default function App() {
  const [coins, setCoins] = React.useState([]);
  const [selectedCoin, setSelectedCoin] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [chartType, setChartType] = React.useState('line');
  const [loading, setLoading] = React.useState(true);
  const [chartLoading, setChartLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const fetchCoins = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!res.ok) throw new Error('Failed to load crypto data');

      const data = await res.json();
      setCoins(data);
      setLastUpdated(new Date());

      setSelectedCoin((prev) => {
        if (!prev) return data[0] || null;
        return data.find((coin) => coin.id === prev.id) || data[0] || null;
      });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCoins();
    const intervalId = setInterval(fetchCoins, 60000);
    return () => clearInterval(intervalId);
  }, [fetchCoins]);

  React.useEffect(() => {
    if (!selectedCoin) return;

    const fetchChart = async () => {
      try {
        setChartLoading(true);
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${selectedCoin.id}/market_chart?vs_currency=usd&days=7&interval=daily`
        );

        if (!res.ok) throw new Error('Failed to load chart data');

        const data = await res.json();
        const formatted = data.prices.map((item, index) => ({
          time: new Date(item[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: item[1],
          volume: data.total_volumes?.[index]?.[1] || 0,
        }));

        setChartData(formatted);
      } catch (err) {
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChart();
  }, [selectedCoin]);

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Container fluid className="py-3 py-md-4 app-shell">
      <Row className="justify-content-center">
        <Col xs={12} xl={11} xxl={10}>
          <Card className="shadow-sm border-0 app-card">
            <Card.Body className="p-3 p-md-4">
              <DashboardHeader lastUpdated={lastUpdated} />
              <SearchBar query={query} setQuery={setQuery} coins={coins} />

              {loading && (
                <div className="text-center py-5 text-theme">
                  <Spinner animation="border" role="status" variant="warning" />
                  <div className="mt-2">Loading live crypto data...</div>
                </div>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              {!loading && !error && (
                <ChartPanel
                  selectedCoin={selectedCoin}
                  chartData={chartData}
                  chartLoading={chartLoading}
                  chartType={chartType}
                  setChartType={setChartType}
                />
              )}

              {!loading && !error && (
                <div className="mt-4">
                  <CryptoTable
                    coins={filteredCoins}
                    selectedCoin={selectedCoin}
                    setSelectedCoin={setSelectedCoin}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
