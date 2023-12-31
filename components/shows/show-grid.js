import ShowItem from "./show-item"
import classes from './show-grid.module.css'

function ShowGrid ({ items }) {
    return (
        <ul className={classes.grid}>
            {items.map(item => (
                <ShowItem key={item._id} show={item} />
            ))}
        </ul>
    )
}
export default ShowGrid
